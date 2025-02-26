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

using Origam.Workbench.Services;
using System;
using static Origam.NewProjectEnums;

namespace Origam.ProjectAutomation
{
    public class NewPackageBuilder : AbstractBuilder
    {
        public override string Name
        {
            get
            {
                return "Create New Package";
            }
        }

        public override void Execute(Project project)
        {
            SchemaService schema = ServiceManager.Services.GetService(typeof(SchemaService))
                as SchemaService;
            schema.UnloadSchema();
            switch (project.TypeTemplate)
            {
                case TypeTemplate.Default:
                    PackageHelper.CreatePackage(project.Name, new Guid(project.NewPackageId),
                    new Guid(project.BasePackageId));
                    break;
                case TypeTemplate.Open:
                case TypeTemplate.Template:
                    schema.LoadSchema(new Guid(project.NewPackageId), false, false);
                    break;
                default:
                    throw new Exception("Bad TypeTemplate " + project.TypeTemplate.ToString());
            }
            schema.UnloadSchema();
        }

        public override void Rollback()
        {
        }
    }
}
