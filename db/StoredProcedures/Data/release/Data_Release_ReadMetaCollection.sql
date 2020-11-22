SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:		Neil O'Keeffe
-- Create date: 02/01/2020
-- Description:	Reads current releases, referencing metadata
-- exec Data_Release_ReadMetaCollection 'en','ga','2020-09-02','C2016P3'
-- =============================================
CREATE
	OR

ALTER PROCEDURE Data_Release_ReadMetaCollection @LngIsoCodeDefault CHAR(2)
	,@LngIsoCodeRead CHAR(2) = NULL
	,@DateFrom DATE = NULL
	,@PrcCode NVARCHAR(32) = NULL
AS
BEGIN
	SET NOCOUNT ON;

	DECLARE @LngIdDefault INT
	DECLARE @LngIdRead INT
	DECLARE @PrcID INT

	SET @LngIdDefault = (
			SELECT LNG_ID
			FROM TS_LANGUAGE
			WHERE LNG_ISO_CODE = @LngIsoCodeDefault
				AND LNG_DELETE_FLAG = 0
			)

	IF @LngIsoCodeRead IS NOT NULL
	BEGIN
		SET @LngIdRead = (
				SELECT LNG_ID
				FROM TS_LANGUAGE
				WHERE LNG_ISO_CODE = @LngIsoCodeRead
					AND LNG_DELETE_FLAG = 0
				)
	END
	ELSE
	BEGIN
		SET @LngIdRead = 0
	END

	IF @LngIsoCodeDefault = @LngIsoCodeRead
	BEGIN
		SET @LngIdRead = 0
	END

	IF @PrcCode IS NOT NULL
	BEGIN
		SET @PrcID = (
				SELECT PRC_ID
				FROM TD_PRODUCT
				WHERE PRC_CODE = @PrcCode
					AND PRC_DELETE_FLAG = 0
				)
	END

	SELECT DISTINCT *
	FROM (
		SELECT RLS_CODE AS RlsCode
			,mtr.MTR_CODE AS MtrCode
			,coalesce(lngMTR.LNG_ISO_CODE, TS_LANGUAGE.LNG_ISO_CODE) AS LngIsoCode
			,coalesce(lngMtr.LNG_ISO_NAME, TS_LANGUAGE.LNG_ISO_NAME) AS LngIsoName
			,coalesce(lngMTR.MTR_TITLE, mtr.MTR_TITLE) AS MtrTitle
			,CPR_VALUE AS CprValue
			,CPR_URL AS CprUrl
			,CPR_CODE AS CprCode
			,RLS_LIVE_DATETIME_FROM AS RlsLiveDatetimeFrom
			,RLS_LIVE_DATETIME_TO AS RlsLiveDatetimeTo
			,RLS_EXCEPTIONAL_FLAG AS ExceptionalFlag
			,FRQ_CODE AS FrqCode
			,FRQ_VALUE AS FrqValue
			,PRD_CODE AS PrdCode
			,PRD_VALUE AS PrdValue
			,STT_CODE AS SttCode
			,STT_VALUE AS SttValue
			,CLS_CODE AS ClsCode
			,CLS_VALUE AS ClsValue
			,VrbCount
		FROM TD_RELEASE rls
		INNER JOIN VW_RELEASE_LIVE_NOW
			ON VRN_RLS_ID = RLS_ID
				AND (
					@DateFrom IS NULL
					OR RLS_LIVE_DATETIME_FROM >= @DateFrom
					)
		INNER JOIN (
			SELECT *
			FROM TD_MATRIX
			WHERE MTR_LNG_ID = @LngIdDefault
			) mtr
			ON RLS_ID = MTR_RLS_ID
				AND MTR_DELETE_FLAG = 0
				AND RLS_DELETE_FLAG = 0
				AND MTR_ID = VRN_MTR_ID
		INNER JOIN TS_COPYRIGHT
			ON CPR_ID = MTR_CPR_ID
				AND CPR_DELETE_FLAG = 0
		INNER JOIN TS_LANGUAGE
			ON LNG_ID = MTR_LNG_ID
				AND LNG_DELETE_FLAG = 0
		INNER JOIN TD_FREQUENCY
			ON FRQ_MTR_ID = MTR_ID
		INNER JOIN TD_PERIOD
			ON FRQ_ID = PRD_FRQ_ID
		INNER JOIN TD_STATISTIC
			ON MTR_ID = STT_MTR_ID
		--INNER JOIN TD_CLASSIFICATION
		--	ON MTR_ID = CLS_MTR_ID
		INNER JOIN(
		SELECT CLS_MTR_ID,CLS_CODE, CLS_VALUE,count(*) as VrbCount
		FROM TD_CLASSIFICATION 
		INNER JOIN TD_VARIABLE
		ON VRB_CLS_ID=CLS_ID 
		GROUP BY CLS_MTR_ID, CLS_CODE, CLS_VALUE
		) clsVrb
		on MTR_ID = CLS_MTR_ID
		LEFT JOIN (
			SELECT MTR_CODE
				,MTR_ID
				,MTR_TITLE
				,MTR_RLS_ID
				,LNG_ISO_CODE
				,LNG_ISO_NAME
			FROM TD_MATRIX
			INNER JOIN TS_LANGUAGE
				ON MTR_LNG_ID = LNG_ID
					AND LNG_DELETE_FLAG = 0
			WHERE Mtr_Lng_ID = @LngIdRead
				AND MTR_DELETE_FLAG = 0
			) lngMtr
			ON lngMtr.MTR_CODE = mtr.MTR_CODE
		WHERE (
				@PrcID IS NULL
				OR @PrcID = RLS_PRC_ID
				)
		) q
END
GO


