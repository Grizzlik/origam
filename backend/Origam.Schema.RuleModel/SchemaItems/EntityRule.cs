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
using Origam.DA.ObjectPersistence;
using Origam.Schema.EntityModel;
using System;
using System.ComponentModel;
using System.Xml.Serialization;

namespace Origam.Schema.RuleModel
{
    [SchemaItemDescription("Entity Rule", "entity-rule.png")]
    [HelpTopic("Entity+Rule")]
    [ClassMetaVersion("6.0.0")]
    public class EntityRule : XPathRule, IEntityRule
    {

		public EntityRule() : base() {}
		public EntityRule(Guid schemaExtensionId) : base(schemaExtensionId) {}
        public EntityRule(Key primaryKey) : base(primaryKey) { }

		[EntityColumn("B01"), DefaultValue(false)] 
        [XmlAttribute("isPathRelative")]
        [Browsable(false)]
		public override bool IsPathRelative { get; set; } = false;
    }
}
