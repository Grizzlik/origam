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

namespace Origam.Schema.GuiModel
{

    public enum DataReportExportFormatType
    {
        PDF = 0
        , MSExcel = 1
        , RTF = 2
        , MSWord = 3
        , HTML = 4
        , CSV = 5
        , TEXT = 6
        , XML = 7
    }

    public static class DataReportExportFormatTypeExtensions
    {
        private static readonly string[] contentTypes =
        {
            "application/pdf"
            , "application/vnd.ms-excel"
            , "application/rtf"
            , "application/msword"
            , "text/html"
            , "text/csv"
            , "text/plain"
            , "text/xml"
        };

        private static readonly string[] extensions =
        {
            "pdf"
            , "xls"
            , "rtf"
            , "doc"
            , "html"
            , "csv"
            , "txt"
            , "xml"
        };

        public static string GetString(this DataReportExportFormatType value)
        {
            return value.ToString();
        }

        public static string GetContentType(this DataReportExportFormatType value)
        {
            return contentTypes[(int)value];
        }

        public static string GetExtension(this DataReportExportFormatType value)
        {
            return extensions[(int)value];
        }
    }
}