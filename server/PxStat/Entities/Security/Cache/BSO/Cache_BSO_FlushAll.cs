﻿using API;
using PxStat.Template;

namespace PxStat.Security
{
    internal class Cache_BSO_FlushAll : BaseTemplate_Update<Cache_DTO_Update, Cache_VLD_Update>
    {
        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="request"></param>
        internal Cache_BSO_FlushAll(JSONRPC_API request) : base(request, new Cache_VLD_Update())
        {
        }

        /// <summary>
        /// Test privileges
        /// </summary>
        /// <returns></returns>
        override protected bool HasPrivilege()
        {
            return IsAdministrator();
        }

        /// <summary>
        /// Execute
        /// </summary>
        /// <returns></returns>
        protected override bool Execute()
        {
            // flush the cache and return success
            MemCacheD.FlushAll();
            Response.data = JSONRPC.success;
            return true;

        }
    }
}
