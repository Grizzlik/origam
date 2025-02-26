﻿#region license
/*
Copyright 2005 - 2021 Advantage Solutions, s. r. o.

This file is part of ORIGAM (http://www.origam.org).

ORIGAM is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

ORIGAM is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with ORIGAM. If not, see <http://www.gnu.org/licenses/>.
*/
#endregion

using System;
using System.ComponentModel.DataAnnotations;
using System.Drawing;
using System.IO;
using System.IO.Compression;
using System.Security.Principal;
using System.Threading;
using CSharpFunctionalExtensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Localization;
using Microsoft.Extensions.Logging;
using Microsoft.Net.Http.Headers;
using Origam.DA;
using Origam.Schema;
using Origam.Server;
using Origam.Workbench.Services;
using ImageMagick;
using Origam.Server.Model.Blob;
using Origam.Server.Model.UIService;

namespace Origam.Server.Controller
{
    [Controller]
    [Route("internalApi/[controller]")]
    public class BlobController : AbstractController
    {
        private readonly IStringLocalizer<SharedResources> localizer;
        private readonly CoreHttpTools httpTools = new CoreHttpTools();
        public BlobController(
            SessionObjects sessionObjects, 
            IStringLocalizer<SharedResources> localizer,
            ILogger<AbstractController> log) : base(log, sessionObjects)
        {
            this.localizer = localizer;
        }
        [HttpPost("[action]")]
        public IActionResult DownloadToken(
            [FromBody][Required]BlobDownloadTokenInput input)
        {
            return AmbiguousInputToRowData(input, dataService)
                .Map(rowData => CreateDownloadToken(input, rowData))
                .Finally(UnwrapReturnValue);
        }
        [HttpPost("[action]")]
        public IActionResult UploadToken(
            [FromBody][Required]BlobUploadTokenInput input)
        {
            return AmbiguousInputToRowData(input, dataService)
                .Map(rowData => CreateUploadToken(input, rowData))
                .Finally(UnwrapReturnValue);
        }
        [AllowAnonymous]
        [HttpGet("{token:guid}")]
        public IActionResult Get(Guid token)
        {
            try
            {
                var blobDownloadRequest = sessionObjects.SessionManager
                    .GetBlobDownloadRequest(token);
                if(blobDownloadRequest == null)
                {
                    return NotFound(localizer["ErrorBlobNotAvailable"]
                        .ToString());
                }
                if(string.IsNullOrEmpty(blobDownloadRequest.BlobMember)
                && blobDownloadRequest.BlobLookupId == Guid.Empty)
                {
                    return BadRequest(
                        localizer["ErrorBlobMemberBlobLookupNotSpecified"]
                            .ToString());
                }
                Stream resultStream;
                MemoryStream memoryStream;
                var processBlobField 
                    = string.IsNullOrEmpty(blobDownloadRequest.BlobMember) 
                      && (blobDownloadRequest.Row[
                              blobDownloadRequest.BlobMember] != DBNull.Value);
                if((blobDownloadRequest.BlobLookupId != Guid.Empty) 
                && !processBlobField)
                {
                    var lookupService = ServiceManager.Services
                        .GetService<IDataLookupService>();
                    var result = lookupService.GetDisplayText(
                        lookupId: blobDownloadRequest.BlobLookupId, 
                        lookupValue: DatasetTools.PrimaryKey(
                            blobDownloadRequest.Row)[0], 
                        useCache: false, 
                        returnMessageIfNull: false, 
                        transactionId: null);
                    byte[] bytes;
                    switch(result)
                    {
                        case null:
                        {
                            return BadRequest(localizer["ErrorBlobNoData"]
                                .ToString());
                        }
                        case byte[] arrayOfBytes:
                        {
                            bytes = arrayOfBytes;
                            break;
                        }
                        default:
                        {
                            return BadRequest(localizer["ErrorBlobNotBlob"]
                                .ToString());
                        }
                    }
                    memoryStream = new MemoryStream(bytes);
                }
                else
                {
                    if(blobDownloadRequest.Row[blobDownloadRequest.BlobMember] 
                    == DBNull.Value)
                    {
                        return BadRequest(localizer["ErrorBlobRecordEmpty"]
                            .ToString());
                    }
                    memoryStream = new MemoryStream((byte[])blobDownloadRequest
                        .Row[blobDownloadRequest.BlobMember]);
                }
                if(blobDownloadRequest.IsCompressed)
                {
                    resultStream = new GZipStream(memoryStream,
                        CompressionMode.Decompress);
                }
                else
                {
                    resultStream = memoryStream;
                }
                var filename = (string)blobDownloadRequest
                    .Row[blobDownloadRequest.Property];
                var disposition = httpTools.GetFileDisposition(
                    new CoreRequestWrapper(Request), filename);
                if(!blobDownloadRequest.IsPreview)
                {
                    disposition = "attachment; " + disposition;
                }
                Response.Headers.Add(
                    HeaderNames.ContentDisposition, disposition);
                return File(resultStream, HttpTools.GetMimeType(filename));
            }
            catch(Exception ex)
            {
                return StatusCode(500, ex);
            }
            finally
            {
                sessionObjects.SessionManager.RemoveBlobDownloadRequest(token);
            }
        }
        [AllowAnonymous]
        [HttpPost("{token:guid}/{filename}")]
        public IActionResult Post(Guid token, string filename)
        {
            try
            {
                var blobUploadRequest = sessionObjects.SessionManager
                    .GetBlobUploadRequest(token);
                if(blobUploadRequest == null)
                {
                    return NotFound(localizer["ErrorBlobFileNotAvailable"]
                        .ToString());
                }
                //todo: review user management
                Thread.CurrentPrincipal =
                    new GenericPrincipal(
                        new GenericIdentity(blobUploadRequest.UserName),
                        new string[] { });
                var profile = SecurityTools.CurrentUserProfile();
                if(CheckMember(blobUploadRequest.OriginalPathMember, false))
                {
                    blobUploadRequest.Row[blobUploadRequest.OriginalPathMember] 
                        = filename;
                }
                if(CheckMember(blobUploadRequest.DateCreatedMember, false))
                {
                    blobUploadRequest.Row[blobUploadRequest.DateCreatedMember] 
                        = blobUploadRequest.DateCreated;
                }
                if(CheckMember(blobUploadRequest.DateLastModifiedMember, false))
                {
                    blobUploadRequest.Row[
                        blobUploadRequest.DateLastModifiedMember] 
                        = blobUploadRequest.DateLastModified;
                }
                if(CheckMember(blobUploadRequest.CompressionStateMember, false))
                {
                    blobUploadRequest.Row[
                        blobUploadRequest.CompressionStateMember] 
                        = blobUploadRequest.ShouldCompress;
                }
                var input = StreamTools.ReadToEnd(Request.Body);
                if(blobUploadRequest.ShouldCompress)
                {
                    var gZipStream = new GZipStream(
                        new MemoryStream(input), CompressionMode.Compress);
                    blobUploadRequest.Row[blobUploadRequest.BlobMember] 
                        = StreamTools.ReadToEnd(gZipStream);
                }
                else
                {
                    blobUploadRequest.Row[blobUploadRequest.BlobMember] = input;
                }
                if(CheckMember(blobUploadRequest.FileSizeMember, false))
                {
                    blobUploadRequest.Row[blobUploadRequest.FileSizeMember] 
                        = input.LongLength;
                }
                if(CheckMember(blobUploadRequest.ThumbnailMember, false))
                {
                    Image image = null;
                    try
                    {
                        image = Image.FromStream(new MemoryStream(input));
                    }
                    catch
                    {
                        blobUploadRequest.Row[blobUploadRequest.ThumbnailMember] 
                            = DBNull.Value;
                    }
                    if(image != null)
                    {
                        try
                        {
                            var parameterService = ServiceManager.Services
                                .GetService<IParameterService>();
                            var width = (int) parameterService
                                .GetParameterValue(
                                    blobUploadRequest.ThumbnailWidthConstantId,
                                    OrigamDataType.Integer);
                            var height = (int) parameterService
                                .GetParameterValue(
                                blobUploadRequest.ThumbnailHeightConstantId,
                                OrigamDataType.Integer);
                            var row = blobUploadRequest.Row;
                            var thumbnailMember 
                                = blobUploadRequest.ThumbnailMember;
                            row[thumbnailMember] 
                                = FixedSizeBytes(input, width, height);
                        }
                        finally
                        {
                            image.Dispose();
                        }
                    }
                }
                DatasetTools.UpdateOrigamSystemColumns(
                    blobUploadRequest.Row, false, profile.Id);
                blobUploadRequest.Row[blobUploadRequest.Property] = filename;
                return Ok();
            }
            catch(Exception ex)
            {
                return StatusCode(500, ex);
            }
            finally
            {
                sessionObjects.SessionManager.RemoveBlobUploadRequest(token);
            }
        }
        private IActionResult CreateDownloadToken(
            BlobDownloadTokenInput input, RowData rowData)
        {
            var token = Guid.NewGuid();
            sessionObjects.SessionManager.AddBlobDownloadRequest(
                token,
                new BlobDownloadRequest(
                    rowData.Row, 
                    input.Parameters, 
                    input.Property, 
                    input.IsPreview));
            return Ok(token);
        }

        private IActionResult CreateUploadToken(
            BlobUploadTokenInput input, RowData rowData)
        {
            var token = Guid.NewGuid();
            sessionObjects.SessionManager.AddBlobUploadRequest(
                token,
                new BlobUploadRequest(
                    rowData.Row,
                    SecurityManager.CurrentPrincipal,
                    input.Parameters,
                    input.DateCreated,
                    input.DateLastModified,
                    input.Property,
                    rowData.Entity));
            return Ok(token);
        }
        private static bool CheckMember(object val, bool throwExceptions)
        {
            if((val != null) && !val.Equals(string.Empty) 
            && !val.Equals(Guid.Empty))
            {
                return true;
            }
            if (throwExceptions)
            {
                throw new NullReferenceException("Member not set.");
            }
            return false;
        }
        private static byte[] FixedSizeBytes(byte[] byteArrayImage, int width, int height)
        {
            MagickImageInfo imageInfo = new MagickImageInfo(byteArrayImage);
            var sourceWidth = imageInfo.Width;
            var sourceHeight = imageInfo.Height;
            var destX = 0;
            var destY = 0;
            float percent;
            var percentWidth = width / (float)sourceWidth;
            var percentHeight = height / (float)sourceHeight;
            if(percentHeight < percentWidth)
            {
                percent = percentHeight;
                destX = Convert.ToInt16((width - (sourceWidth * percent)) / 2);
            }
            else
            {
                percent = percentWidth;
                destY = Convert.ToInt16(
                    (height - (sourceHeight * percent)) / 2);
            }
            var destWidth = (int)(sourceWidth * percent);
            var destHeight = (int)(sourceHeight * percent);
            var backgroundImage = new MagickImage(MagickColors.Black, width, height);
            backgroundImage.Resize(width, height);
            var pictureBitmap = new MagickImage(byteArrayImage);
            pictureBitmap.Resize(destWidth,destHeight);
            backgroundImage.Composite(pictureBitmap, destX, destY);
            return backgroundImage.ToByteArray(imageInfo.Format);
        }
    }
}