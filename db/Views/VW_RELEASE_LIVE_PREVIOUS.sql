SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:		Neil O'Keeffe
-- Create date: Revised 04/02/2020
-- Description:	Gets the previous live release
-- =============================================
CREATE
	OR

ALTER VIEW VW_RELEASE_LIVE_PREVIOUS
AS
SELECT RLS.RLS_ID AS VRP_RLS_ID
	,MTR.MTR_ID AS VRP_MTR_ID
FROM (
	SELECT MTR_CODE
		,MAX(RLS_VERSION) AS RLS_VERSION_MAX
	FROM TD_MATRIX
	INNER JOIN TD_RELEASE
		ON RLS_ID = MTR_RLS_ID
			AND RLS_DELETE_FLAG = 0
			AND RLS_LIVE_FLAG = 1
			AND RLS_VERSION != 0
			AND RLS_REVISION = 0
			AND (
				RLS_LIVE_DATETIME_FROM IS NOT NULL
				AND getDate() > RLS_LIVE_DATETIME_FROM
				)
			AND (
				RLS_LIVE_DATETIME_TO IS NOT NULL
				AND getDate() > RLS_LIVE_DATETIME_TO
				)
	WHERE MTR_DELETE_FLAG = 0
	GROUP BY MTR_CODE
	) q
INNER JOIN TD_MATRIX MTR
	ON MTR.MTR_CODE = Q.MTR_CODE
INNER JOIN TD_RELEASE RLS
	ON RLS.RLS_ID = MTR_RLS_ID
		AND RLS_VERSION = RLS_VERSION_MAX
		AND RLS_REVISION = 0
		AND RLS_DELETE_FLAG = 0
		AND RLS_LIVE_FLAG = 1
GO


