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
using Origam.DA.ObjectPersistence;
using Origam.DA.Service;
using Origam.Schema;
using Origam.Workbench.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;

namespace Origam.Rule
{
    public class ModelRules
    {
        public static List<Dictionary<IFilePersistent, string>> GetErrors(
            List<AbstractSchemaItemProvider> schemaProviders,
            FilePersistenceService independentPersistenceService,
            CancellationToken cancellationToken)
        {
            IStatusBarService statusBar =
            ServiceManager.Services.GetService<IStatusBarService>();
            statusBar.SetStatusText("Indexing references...");
            ReferenceIndexManager.ClearReferenceIndex(false);
           List<Dictionary<IFilePersistent, string>> errorFragments = independentPersistenceService
                    .SchemaProvider
                    .RetrieveList<IFilePersistent>()
                    .OfType<AbstractSchemaItem>()
                    .AsParallel()
                    .Select(retrievedObj => {
                        retrievedObj.RootProvider = schemaProviders.FirstOrDefault(x => BelongsToProvider(x, retrievedObj));
                        cancellationToken.ThrowIfCancellationRequested();
                        ReferenceIndexManager.AddToBuildIndex(retrievedObj);
                        return retrievedObj;
                    })
                    .AsParallel()
                    .Select(retrievedObj =>
                    {
                        cancellationToken.ThrowIfCancellationRequested();
                        var errorMessages = RuleTools.GetExceptions(retrievedObj)
                            .Select(exception => exception.Message)
                            .ToList();
                        if (errorMessages.Count == 0) return null;

                        return new Dictionary<IFilePersistent, string>
                        {
                            { retrievedObj, string.Join("\n", errorMessages) }
                        };
                    })
                    .Where(x => x != null)
                    .ToList();
            ReferenceIndexManager.ActivateReferenceIndex();
            statusBar.SetStatusText("");
            return errorFragments;
        }

        private static bool BelongsToProvider(ISchemaItemProvider provider, AbstractSchemaItem retrievedObj)
        {
            if(String.Compare(retrievedObj.ItemType, ((AbstractSchemaItemProvider)provider).RootItemType,true)==0)
            {
                return true;
            }
            return false;
        }
    }
}
