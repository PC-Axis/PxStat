﻿using API;
using PxStat.Template;
using System.Collections.Generic;
using System.Dynamic;

namespace PxStat.Security
{
    /// <summary>
    /// Reads language data from Analytics
    /// </summary>
    internal class Analytic_BSO_ReadLanguage : BaseTemplate_Read<Analytic_DTO_Read, Analytic_VLD_ReadLanguage>
    {
        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="request"></param>
        internal Analytic_BSO_ReadLanguage(JSONRPC_API request) : base(request, new Analytic_VLD_ReadLanguage())
        { }

        /// <summary>
        /// Test privilege
        /// </summary>
        /// <returns></returns>
        override protected bool HasPrivilege()
        {
            return IsPowerUser() || IsModerator();
        }

        /// <summary>
        /// Execute
        /// </summary>
        /// <returns></returns>
        protected override bool Execute()
        {
            Analytic_ADO ado = new Analytic_ADO(Ado);
            ADO_readerOutput outputSummary = ado.ReadLanguage(DTO,SamAccountName );
            if (outputSummary.hasData)
            {
                Response.data = FormatData(outputSummary.data);
                return true;
            }
            return false;
        }

        /// <summary>
        /// Format data for output
        /// </summary>
        /// <param name="readData"></param>
        /// <returns></returns>
        private dynamic FormatData(dynamic readData)
        {
            dynamic output = new ExpandoObject();
            var itemDict = output as IDictionary<string, object>;


            foreach (dynamic item in readData)
            {
                itemDict.Add(item.LngIsoName, item.lngCount);
            }
            return output;
        }

    }
}
