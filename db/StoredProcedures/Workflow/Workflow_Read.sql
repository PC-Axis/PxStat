/****** Object:  StoredProcedure [dbo].[Workflow_Workflow_Read]    Script Date: 30/10/2018 15:31:43 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:		Neil O'Keeffe
-- Create date: 30/10/2018
-- Description:	To read the status of an individual workflow
-- exec Workflow_Read 132,'OKeeffeNe',0
-- =============================================
CREATE
	OR

ALTER PROCEDURE Workflow_Read @RlsCode INT
	,@CcnUsername NVARCHAR(256)
	,@WrqCurrentRequestOnly BIT = NULL
AS
BEGIN
	SET NOCOUNT ON;

	SELECT DISTINCT RLS_CODE AS RlsCode
		,WRQ_DATETIME AS WrqDatetime
		,WRQ_EXCEPTIONAL_FLAG AS WrqExceptionalFlag
		,WRQ_RESERVATION_FLAG AS WrqReservationFlag
		,WRQ_ARCHIVE_FLAG AS WrqArchiveFlag
		,WRQ_EXPERIMENTAL_FLAG As WrqExperimentalFlag
		,RQS_CODE AS RqsCode
		,RQS_VALUE AS RqsValue
		,RQS_CMM.CMM_VALUE AS RqsCmmValue
		,RQS_CCN.CCN_USERNAME AS RqsCcnCreateUsername
		,RQS_DHT.DHT_DATETIME AS RqsDtgCreateDatetime
		,RSP_CODE AS RspCode
		,RSP_VALUE AS RspValue
		,RSP_CMM.CMM_VALUE AS RspCmmValue
		,RSP_CCN.CCN_USERNAME AS RspCcnCreateUsername
		,RSP_DHT.DHT_DATETIME AS RspDtgCreateDatetime
		,SGN_CODE AS SgnCode
		,SGN_VALUE AS SgnValue
		,SGN_CMM.CMM_VALUE AS SgnCmmValue
		,SGN_CCN.CCN_USERNAME AS SgnCcnCreateUsername
		,SGN_DHT.DHT_DATETIME AS SgnDtgCreateDatetime
	FROM TD_RELEASE
	LEFT OUTER JOIN TD_WORKFLOW_REQUEST
		ON RLS_ID = WRQ_RLS_ID
			AND WRQ_DELETE_FLAG = 0
	LEFT OUTER JOIN TS_REQUEST
		ON WRQ_RQS_ID = RQS_ID
	LEFT OUTER JOIN TD_COMMENT RQS_CMM
		ON WRQ_CMM_ID = RQS_CMM.CMM_ID
			AND RQS_CMM.CMM_DELETE_FLAG = 0
	LEFT OUTER JOIN TD_AUDITING RQS_DTG
		ON WRQ_DTG_ID = RQS_DTG.DTG_ID
	LEFT OUTER JOIN TM_AUDITING_HISTORY RQS_DHT
		ON RQS_DTG.DTG_ID = RQS_DHT.DHT_DTG_ID
	INNER JOIN TS_AUDITING_TYPE RQS_DTP
		ON RQS_DHT.DHT_DTP_ID = RQS_DTP.DTP_ID
			AND RQS_DTP.DTP_CODE = 'CREATED'
	LEFT OUTER JOIN TD_ACCOUNT RQS_CCN
		ON RQS_DHT.DHT_CCN_ID = RQS_CCN.CCN_ID
	LEFT OUTER JOIN TD_WORKFLOW_RESPONSE resp
		ON WRQ_ID = resp.WRS_WRQ_ID
	LEFT OUTER JOIN TS_RESPONSE
		ON resp.WRS_RSP_ID = RSP_ID
	LEFT OUTER JOIN TD_COMMENT RSP_CMM
		ON resp.WRS_CMM_ID = RSP_CMM.CMM_ID
			AND RSP_CMM.CMM_DELETE_FLAG = 0
	LEFT OUTER JOIN TD_AUDITING RSP_DTG
		ON WRS_DTG_ID = RSP_DTG.DTG_ID
	LEFT OUTER JOIN TM_AUDITING_HISTORY RSP_DHT
		ON RSP_DTG.DTG_ID = RSP_DHT.DHT_DTG_ID
	LEFT OUTER JOIN TS_AUDITING_TYPE RSP_DTP
		ON RSP_DHT.DHT_DTP_ID = RSP_DTP.DTP_ID
			AND RSP_DTP.DTP_CODE = 'CREATED'
	LEFT OUTER JOIN TD_ACCOUNT RSP_CCN
		ON RSP_DHT.DHT_CCN_ID = RSP_CCN.CCN_ID
	LEFT OUTER JOIN TD_WORKFLOW_SIGNOFF
		ON resp.WRS_ID = WSG_WRS_ID
	LEFT OUTER JOIN TS_SIGNOFF
		ON WSG_SGN_ID = SGN_ID
	LEFT OUTER JOIN TD_COMMENT SGN_CMM
		ON WSG_CMM_ID = SGN_CMM.CMM_ID
			AND SGN_CMM.CMM_DELETE_FLAG = 0
	LEFT OUTER JOIN TD_AUDITING SGN_DTG
		ON WSG_DTG_ID = SGN_DTG.DTG_ID
	LEFT OUTER JOIN TM_AUDITING_HISTORY SGN_DHT
		ON SGN_DHT.DHT_DTG_ID = SGN_DTG.DTG_ID
	LEFT OUTER JOIN TS_AUDITING_TYPE SGN_DTP
		ON SGN_DTP.DTP_ID = SGN_DHT.DHT_DTP_ID
			AND SGN_DTP.DTP_CODE = 'CREATED'
	LEFT OUTER JOIN TD_ACCOUNT SGN_CCN
		ON SGN_DHT.DHT_CCN_ID = SGN_CCN.CCN_ID
	WHERE RLS_CODE = @RlsCode
		AND RLS_DELETE_FLAG = 0
		AND (
			@WrqCurrentRequestOnly IS NULL --if null we get all Requests
			OR (
				@WrqCurrentRequestOnly = 1
				AND WRQ_CURRENT_FLAG = 1
				) --otherwise we just the current request
			OR @WrqCurrentRequestOnly = 0
			)
		AND @CcnUsername IN (
			SELECT ccn.CCN_USERNAME
			FROM TD_ACCOUNT ccn
			INNER JOIN TS_PRIVILEGE prv
				ON ccn.CCN_PRV_ID = prv.PRV_ID
					AND (
						prv.PRV_CODE = 'ADMINISTRATOR'
						OR PRV.PRV_CODE = 'POWER_USER'
						-- or the user has access to this group
						OR RLS_CODE IN (
							SELECT RLS_CODE
							FROM TD_RELEASE
							INNER JOIN TD_GROUP
								ON RLS_GRP_ID = GRP_ID
									AND GRP_DELETE_FLAG = 0
							INNER JOIN TM_GROUP_ACCOUNT
								ON GRP_ID = GCC_GRP_ID
									AND GCC_DELETE_FLAG = 0
							INNER JOIN TD_ACCOUNT
								ON GCC_CCN_ID = CCN_ID
									AND CCN_DELETE_FLAG = 0
							WHERE CCN_USERNAME = @CcnUsername
							)
						)
					AND ccn.CCN_DELETE_FLAG = 0
			)
END
