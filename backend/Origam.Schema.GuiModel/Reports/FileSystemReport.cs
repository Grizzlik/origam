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

using Origam.DA.Common;
using System;
using System.ComponentModel;
using System.Xml.Serialization;
using Origam.DA.ObjectPersistence;

namespace Origam.Schema.GuiModel
{
	[SchemaItemDescription("File System Report", "icon_file-system-report.png")]
    [HelpTopic("File+System+Report")]
    [ClassMetaVersion("6.0.0")]
    public class FileSystemReport : AbstractReport
    {
		public FileSystemReport() : base() { }

		public FileSystemReport(Guid schemaExtensionId) : base(schemaExtensionId) { }

		public FileSystemReport(Key primaryKey) : base(primaryKey) { }

        private string _reportPath;

		[EntityColumn("LS01")]
        [Description("Absolute path to the report. It can contain placeholders inside curly brackets which denote parameters.")]
        [XmlAttribute("reportPath")]
        public string ReportPath
		{
			get
			{
				return _reportPath;
			}
			set
			{
				_reportPath = value;
			}
		}
    }
}
