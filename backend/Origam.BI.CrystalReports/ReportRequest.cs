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

using Origam.BI.CrystalReports;
using System.Collections.Generic;
using System.Data;
using System.Runtime.Serialization;
using System.Text;
using System.Xml;

namespace Origam.CrystalReportsService.Models
{
    [DataContract(Namespace = "")]
    public class ReportRequest
    {
        [DataMember()]
        public string Data
        {
            get
            {
                var stringBuilder = new StringBuilder();
                using (var stringWriter = new EncodingStringWriter(stringBuilder, Encoding.UTF8))
                {
                    using (var xmlWriter = XmlWriter.Create(stringWriter,
                    new XmlWriterSettings { Encoding = UTF8Encoding.UTF8 }))
                    {
                        Dataset.WriteXml(xmlWriter, XmlWriteMode.WriteSchema);
                    }
                }
                return stringBuilder.ToString();
            }
            set
            {

            }
        }

        public DataSet Dataset { get; set; }

        [DataMember()]
        public List<Parameter> Parameters { get; set; } = new List<Parameter>();
    }
}