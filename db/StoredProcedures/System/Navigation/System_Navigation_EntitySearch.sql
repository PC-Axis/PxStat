SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:		Neil O'Keeffe
-- Create date: 19/01/2021
-- Description:	Returns the entity search details
-- =============================================
CREATE
	OR

ALTER PROCEDURE [dbo].[System_Navigation_EntitySearch] @MtrCode NVARCHAR(20) = NULL
	,@MtrOfficialFlag BIT = NULL
	,@SbjCode INT = NULL
	,@PrcCode NVARCHAR(32) = NULL
	,@CprCode NVARCHAR(32) = NULL
	,@RlsExceptionalFlag BIT = NULL
	,@RlsReservationFlag BIT = NULL
	,@RlsArchiveFlag BIT = NULL
	,@RlsAnalyticalFlag BIT = NULL
	,@RlsExperimentalFlag BIT = NULL
AS
BEGIN
	SET NOCOUNT ON;

	IF @MtrCode IS NULL
		AND @MtrOfficialFlag IS NULL
		AND @SbjCode IS NULL
		AND @PrcCode IS NULL
		AND @CprCode IS NULL
		AND @RlsExceptionalFlag IS NULL
		AND @RlsReservationFlag IS NULL
		AND @RlsArchiveFlag IS NULL
		AND @RlsAnalyticalFlag IS NULL
		AND @RlsExperimentalFlag IS NULL
	BEGIN
		RETURN;
	END

	SELECT DISTINCT MTR_CODE AS MtrCode
		,NULL AS sValue
		,NULL AS sKey
		,NULL AS Attribute
		,NULL FoundValue
		,'Entity' AS KwrSource
	FROM TD_RELEASE
	INNER JOIN (
		SELECT DISTINCT VRN_RLS_ID
		FROM VW_RELEASE_LIVE_NOW
		) AS LIVE_NOW ON RLS_ID = VRN_RLS_ID
	LEFT OUTER JOIN TD_PRODUCT ON RLS_PRC_ID = PRC_ID
	LEFT OUTER JOIN TD_SUBJECT ON PRC_SBJ_ID = SBJ_ID
	INNER JOIN TD_MATRIX ON MTR_RLS_ID = RLS_ID
		AND RLS_DELETE_FLAG = 0
		AND MTR_DELETE_FLAG = 0
	INNER JOIN TS_COPYRIGHT ON MTR_CPR_ID = CPR_ID
		AND CPR_DELETE_FLAG = 0
	LEFT OUTER JOIN TD_CLASSIFICATION ON MTR_ID = CLS_MTR_ID
	LEFT OUTER JOIN TD_FREQUENCY ON MTR_ID = FRQ_MTR_ID
	LEFT OUTER JOIN TD_PERIOD ON FRQ_ID = PRD_FRQ_ID
	WHERE (
			@PrcCode IS NULL
			OR @PrcCode = PRC_CODE
			)
		AND (
			@SbjCode IS NULL
			OR @SbjCode = SBJ_CODE
			)
		AND (
			@MtrCode IS NULL
			OR @MtrCode = MTR_CODE
			)
		AND (
			@MtrOfficialFlag IS NULL
			OR @MtrOfficialFlag = MTR_OFFICIAL_FLAG
			)
		AND (
			@CprCode IS NULL
			OR @CprCode = CPR_CODE
			)
		AND (
			@RlsExceptionalFlag IS NULL
			OR @RlsExceptionalFlag = RLS_EXCEPTIONAL_FLAG
			)
		AND (
			@RlsReservationFlag IS NULL
			OR @RlsReservationFlag = RLS_RESERVATION_FLAG
			)
		AND (
			@RlsArchiveFlag IS NULL
			OR @RlsArchiveFlag = RLS_ARCHIVE_FLAG
			)
		AND (
			@RlsAnalyticalFlag IS NULL
			OR @RlsAnalyticalFlag = RLS_ANALYTICAL_FLAG
			)
		AND (
			@RlsExperimentalFlag IS NULL
			OR @RlsExperimentalFlag = RLS_EXPERIMENTAL_FLAG
			);
END