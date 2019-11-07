SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:		Neil O'Keeffe
-- Create date: 11/06/2019
-- Description:	Reads a history of release uploads based on either the user's group or the user's privilege
-- exec Data_Matrix_ReadHistory 'okeeffene','2019-07-31','2019-07-31'
-- =============================================
CREATE
	OR

ALTER PROCEDURE Data_Matrix_ReadHistory @CcnUsername NVARCHAR(256)
	,@DateFrom DATETIME
	,@DateTo DATETIME
AS
BEGIN
	SET NOCOUNT ON;

	DECLARE @GroupUserHasAccess TABLE (GRP_ID INT NOT NULL);

	SET @DateTo = dateadd(day, 1, @DateTo)

	INSERT INTO @GroupUserHasAccess
	EXEC Security_Group_AccessList @CcnUsername

	SELECT MTR_CODE MtrCode
		,RLS_CODE RlsCode
		,RLS_LIVE_DATETIME_FROM RlsLiveDatetimeFrom
		,RLS_LIVE_DATETIME_TO RlsLiveDatetimeTo
		,RLS_VERSION RlsVersion
		,RLS_REVISION RlsRevision
		,GRP_CODE AS GrpCode
		,GRP_NAME AS GrpName
		,CCN_USERNAME AS CcnUsername
		,COALESCE(DHT_UPDATE.DHT_DATETIME, DHT_CREATE.DHT_DATETIME) AS CreateDatetime
	FROM TD_MATRIX
	INNER JOIN TD_RELEASE
		ON RLS_ID = MTR_RLS_ID
			AND RLS_DELETE_FLAG = 0
			AND MTR_DELETE_FLAG = 0
	INNER JOIN @GroupUserHasAccess g
		ON g.GRP_ID = RLS_GRP_ID
	INNER JOIN TD_GROUP
		ON RLS_GRP_ID = TD_GROUP.GRP_ID
			AND GRP_DELETE_FLAG = 0
	INNER JOIN TD_AUDITING
		ON MTR_DTG_ID = DTG_ID
	INNER JOIN TM_AUDITING_HISTORY DHT_CREATE
		ON DTG_ID = DHT_CREATE.DHT_DTG_ID
	INNER JOIN TD_ACCOUNT
		ON DHT_CREATE.DHT_CCN_ID = CCN_ID
	INNER JOIN TS_AUDITING_TYPE DTP_CREATE
		ON DHT_CREATE.DHT_DTP_ID = DTP_CREATE.DTP_ID
			AND DTP_CREATE.DTP_CODE = 'CREATED'
	LEFT JOIN TM_AUDITING_HISTORY DHT_UPDATE
		ON DTG_ID = DHT_UPDATE.DHT_DTG_ID
	LEFT JOIN TS_AUDITING_TYPE DTP_UPDATE
		ON DHT_UPDATE.DHT_DTP_ID = DTP_UPDATE.DTP_ID
			AND DHT_UPDATE.DHT_DATETIME = (
				SELECT max(DHT_DATETIME)
				FROM TM_AUDITING_HISTORY
				WHERE DHT_DTG_ID = DTG_ID
				)
			AND DTP_UPDATE.DTP_CODE = 'UPDATED'
	WHERE MTR_DELETE_FLAG = 0
		AND DHT_CREATE.DHT_DATETIME >= @DateFrom
		AND DHT_CREATE.DHT_DATETIME <= @DateTo
	GROUP BY MTR_CODE
		,RLS_CODE
		,RLS_LIVE_DATETIME_TO
		,RLS_REVISION
		,RLS_VERSION
		,RLS_LIVE_DATETIME_FROM
		,GRP_CODE
		,GRP_NAME
		,CCN_USERNAME
		,COALESCE(DHT_UPDATE.DHT_DATETIME, DHT_CREATE.DHT_DATETIME)
	ORDER BY MTR_CODE
		,RLS_VERSION
		,RLS_REVISION
END
GO

