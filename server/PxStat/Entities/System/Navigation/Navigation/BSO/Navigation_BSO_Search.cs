﻿using API;
using PxStat.Data;
using PxStat.Template;
using System;

namespace PxStat.System.Navigation
{
    /// <summary>
    /// Searches for releases via keywords
    /// </summary>
    internal class Navigation_BSO_Search : BaseTemplate_Read<Navigation_DTO_Search, Navigation_VLD_Search>
    {
        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="request"></param>
        /// 

        int searchTermCount;

        internal Navigation_BSO_Search(JSONRPC_API request) : base(request, new Navigation_VLD_Search())
        { }

        /// <summary>
        /// Test authentication
        /// </summary>
        /// <returns></returns>
        protected override bool HasUserToBeAuthenticated()
        {
            return false;
        }

        /// <summary>
        /// Test privilege
        /// </summary>
        /// <returns></returns>
        override protected bool HasPrivilege()
        {
            return true;
        }

        /// <summary>
        /// Execute
        /// </summary>
        /// <returns></returns>
        protected override bool Execute()
        {

            Navigation_ADO adoNav = new Navigation_ADO(Ado);
            Navigation_BSO nBso = new Navigation_BSO(Ado, DTO);
            bool wordSearch = false;
            if (!String.IsNullOrEmpty(DTO.Search))
            {
                DTO.SearchTerms = nBso.PrepareSearchData();
                wordSearch = true;
            }

            //DTO.search has too much variation to use as a cache key - the search terms are formatted in the table so we don't need it any more     
            DTO.Search = "";

            MemCachedD_Value cache = MemCacheD.Get_BSO("PxStat.System.Navigation", "Navigation_API", "Search", DTO); //
            if (cache.hasData)
            {
                Response.data = cache.data;
                return true;
            }

            if (wordSearch)
                Response.data = nBso.RunWordSearch();
            else
                Response.data = nBso.RunEntitySearch();


            DateTime minDateItem = default;

            Release_ADO rAdo = new Release_ADO(Ado);

            dynamic dateQuery = rAdo.ReadNextReleaseDate();
            if (dateQuery != null)
                minDateItem = dateQuery.RlsDatetimeNext.Equals(DBNull.Value) ? default(DateTime) : dateQuery.RlsDatetimeNext;
            else
                minDateItem = default;

            MemCacheD.Store_BSO("PxStat.System.Navigation", "Navigation_API", "Search", DTO, Response.data, minDateItem, Resources.Constants.C_CAS_NAVIGATION_SEARCH);

            return true;
        }

    }


}
