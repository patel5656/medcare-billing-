// src/constants/packetManifests.js

/**
 * Provider-Specific Page Manifests
 * ANIK: 16 Pages
 * DAV'S: 14 Pages
 * JOSMIC: 7 Pages
 */

export const PACKET_MANIFESTS = {
  'prov-anik': {
    providerId: 'prov-anik',
    providerName: 'FM Laser Therapy',
    totalPages: 15,
    pages: [
      { pageNumber: 1, id: 'anik-cover', type: 'COVER', title: 'Patient & Case Cover Page', componentKey: 'AnikCoverPage' },
      { pageNumber: 2, id: 'anik-bill-1', type: 'BILLING', title: 'Provider Billing Statement', componentKey: 'PrintableBillingStatement', pageIndex: 0 },
      { pageNumber: 3, id: 'anik-cms-1', type: 'CMS-1500', title: 'CMS-1500 Claim (01/22/2026)', componentKey: 'CmsRedGridForm', claimIndex: 0 },
      { pageNumber: 4, id: 'anik-cms-2', type: 'CMS-1500', title: 'CMS-1500 Claim (01/24/2026)', componentKey: 'CmsRedGridForm', claimIndex: 1 },
      { pageNumber: 5, id: 'anik-cms-3', type: 'CMS-1500', title: 'CMS-1500 Claim (01/26/2026)', componentKey: 'CmsRedGridForm', claimIndex: 2 },
      { pageNumber: 6, id: 'anik-assess', type: 'ASSESSMENT', title: 'Therapy Assessment Chart', componentKey: 'AnikTherapyAssessmentForm' },
      { pageNumber: 7, id: 'anik-proc-1', type: 'PROCEDURE', title: 'Laser Procedure Form (01/22/2026)', componentKey: 'AnikLaserProcedureForm', pageIndex: 0, dos: '01/22/2026' },
      { pageNumber: 8, id: 'anik-proc-2', type: 'PROCEDURE', title: 'Laser Procedure Form (01/24/2026)', componentKey: 'AnikLaserProcedureForm', pageIndex: 1, dos: '01/24/2026' },
      { pageNumber: 9, id: 'anik-proc-3', type: 'PROCEDURE', title: 'Laser Procedure Form (01/26/2026)', componentKey: 'AnikLaserProcedureForm', pageIndex: 2, dos: '01/26/2026' },
      { pageNumber: 10, id: 'anik-narr-1', type: 'NARRATIVE', title: 'Initial Narrative Report (Page 1)', componentKey: 'AnikNarrativeReport', reportPage: 1 },
      { pageNumber: 11, id: 'anik-narr-2', type: 'NARRATIVE', title: 'Initial Narrative Report (Page 2)', componentKey: 'AnikNarrativeReport', reportPage: 2 },
      { pageNumber: 12, id: 'anik-narr-3', type: 'NARRATIVE', title: 'Initial Narrative Report (Page 3)', componentKey: 'AnikNarrativeReport', reportPage: 3 },
      { pageNumber: 13, id: 'anik-final-1', type: 'NARRATIVE', title: 'Final Medical / Discharge Report (Page 1)', componentKey: 'AnikFinalReport', reportPage: 1 },
      { pageNumber: 14, id: 'anik-final-2', type: 'NARRATIVE', title: 'Final Medical / Discharge Report (Page 2)', componentKey: 'AnikFinalReport', reportPage: 2 },
      { pageNumber: 15, id: 'anik-final-3', type: 'NARRATIVE', title: 'Final Medical / Discharge Report (Page 3)', componentKey: 'AnikFinalReport', reportPage: 3 },
    ]
  },

  'prov-davs': {
    providerId: 'prov-davs',
    providerName: "FM Dav’s Anatomy",
    totalPages: 13,
    pages: [
      { pageNumber: 1, id: 'davs-cover', type: 'COVER', title: 'Patient & Case Cover Page', componentKey: 'DavCoverPage' },
      { pageNumber: 2, id: 'davs-bill-1', type: 'BILLING', title: 'Provider Billing Statement', componentKey: 'PrintableBillingStatement', pageIndex: 0 },
      { pageNumber: 3, id: 'davs-cms-1', type: 'CMS-1500', title: 'CMS-1500 Claim Form', componentKey: 'CmsRedGridForm', claimIndex: 0 },
      { pageNumber: 4, id: 'davs-cms-2', type: 'CMS-1500', title: 'CMS-1500 Claim Form', componentKey: 'CmsRedGridForm', claimIndex: 1 },
      { pageNumber: 5, id: 'davs-cms-3', type: 'CMS-1500', title: 'CMS-1500 Claim Form', componentKey: 'CmsRedGridForm', claimIndex: 2 },
      { pageNumber: 6, id: 'davs-prog-1', type: 'ASSESSMENT', title: 'Clinical Progress Note (Page 1)', componentKey: 'DavProgressNote', notePage: 1 },
      { pageNumber: 7, id: 'davs-prog-2', type: 'ASSESSMENT', title: 'Clinical Progress Note (Page 2)', componentKey: 'DavProgressNote', notePage: 2 },
      { pageNumber: 8, id: 'davs-proc-1', type: 'PROCEDURE', title: 'ESWT Shockwave Form (01/22/2026)', componentKey: 'DavEswtProcedureForm', pageIndex: 0, formPage: 1, dos: '01/22/2026' },
      { pageNumber: 9, id: 'davs-proc-2', type: 'PROCEDURE', title: 'ESWT Shockwave Form (01/24/2026)', componentKey: 'DavEswtProcedureForm', pageIndex: 1, formPage: 2, dos: '01/24/2026' },
      { pageNumber: 10, id: 'davs-proc-3', type: 'PROCEDURE', title: 'ESWT Shockwave Form (01/26/2026)', componentKey: 'DavEswtProcedureForm', pageIndex: 2, formPage: 3, dos: '01/26/2026' },
      { pageNumber: 11, id: 'davs-final-1', type: 'NARRATIVE', title: 'Shockwave Narrative Report (Page 1)', componentKey: 'DavFinalNarrative', reportPage: 1 },
      { pageNumber: 12, id: 'davs-final-2', type: 'NARRATIVE', title: 'Shockwave Narrative Report (Page 2)', componentKey: 'DavFinalNarrative', reportPage: 2 },
      { pageNumber: 13, id: 'davs-final-3', type: 'NARRATIVE', title: 'Shockwave Narrative Report (Page 3)', componentKey: 'DavFinalNarrative', reportPage: 3 },
    ]
  },

  'prov-josmic': {
    providerId: 'prov-josmic',
    providerName: 'FM Health and Wellness Center',
    totalPages: 7,
    pages: [
      { pageNumber: 1, id: 'josmic-cover', type: 'COVER', title: 'Patient & Case Cover Page', componentKey: 'JosmicCoverPage' },
      { pageNumber: 2, id: 'josmic-bill-1', type: 'BILLING', title: 'Provider Billing Statement', componentKey: 'PrintableBillingStatement', pageIndex: 0 },
      { pageNumber: 3, id: 'josmic-cms-1', type: 'CMS-1500', title: 'CMS-1500 Claim (12/30/2025)', componentKey: 'CmsRedGridForm', claimIndex: 0 },
      { pageNumber: 4, id: 'josmic-pain-1', type: 'NARRATIVE', title: 'Pain Management Report (Page 1)', componentKey: 'JosmicPainManagementReport', reportPage: 1 },
      { pageNumber: 5, id: 'josmic-pain-2', type: 'NARRATIVE', title: 'Pain Management Report (Page 2)', componentKey: 'JosmicPainManagementReport', reportPage: 2 },
      { pageNumber: 6, id: 'josmic-pain-3', type: 'NARRATIVE', title: 'Pain Management Report (Page 3)', componentKey: 'JosmicPainManagementReport', reportPage: 3 },
      { pageNumber: 7, id: 'josmic-pain-4', type: 'NARRATIVE', title: 'Pain Management Report (Page 4)', componentKey: 'JosmicPainManagementReport', reportPage: 4 },
    ]
  },

  'prov-counselor': {
    providerId: 'prov-counselor',
    providerName: 'FM Counseling Center',
    totalPages: 10,
    pages: [
      { pageNumber: 1, id: 'counselor-eval-1', type: 'ASSESSMENT', title: 'Psychiatric Diagnostic Evaluation (Form 1)', componentKey: 'CounselorCoverPage' },
      { pageNumber: 2, id: 'counselor-summary-2', type: 'ASSESSMENT', title: 'Counseling Treatment Summary & Services (Form 2)', componentKey: 'CounselorTreatmentSummaryForm' },
      { pageNumber: 3, id: 'counselor-report-3', type: 'ASSESSMENT', title: 'Psychiatric Clinical Report (Form 3)', componentKey: 'CounselorPsychiatricReportForm' },
      { pageNumber: 4, id: 'counselor-impression-4', type: 'ASSESSMENT', title: 'Diagnostic Impression & Treatment Objectives (Form 4)', componentKey: 'CounselorDiagnosticImpressionForm' },
      { pageNumber: 5, id: 'counselor-course-5', type: 'ASSESSMENT', title: 'Clinical Summary & Course of Care (Form 5)', componentKey: 'CounselorCourseOfCareForm' },
      { pageNumber: 6, id: 'counselor-notes-6', type: 'ASSESSMENT', title: 'Psychotherapy Progress Notes Sessions 3-8 (Form 6)', componentKey: 'CounselorSessionNotesPart1Form' },
      { pageNumber: 7, id: 'counselor-notes-7', type: 'ASSESSMENT', title: 'Psychotherapy Progress Notes Sessions 9-17 (Form 7)', componentKey: 'CounselorSessionNotesPart2Form' },
      { pageNumber: 8, id: 'counselor-discharge-8', type: 'ASSESSMENT', title: 'Discharge and Follow-Up Plan (Form 8)', componentKey: 'CounselorDischargePlanForm' },
      { pageNumber: 9, id: 'counselor-billing-9', type: 'BILLING', title: 'Billing Statement Page 1 (Form 9)', componentKey: 'CounselorBillingStatementPart1Form' },
      { pageNumber: 10, id: 'counselor-billing-10', type: 'BILLING', title: 'Billing Statement Page 2 & Balance Due (Form 10)', componentKey: 'CounselorBillingStatementPart2Form' },
    ]
  },

  'prov-tpi': {
    providerId: 'prov-tpi',
    providerName: 'FM Trigger Point Injection Clinic',
    totalPages: 5,
    pages: [
      { pageNumber: 1, id: 'tpi-cover', type: 'COVER', title: 'Patient & Case Cover Page', componentKey: 'TpiCoverPage' },
      { pageNumber: 2, id: 'tpi-bill-1', type: 'BILLING', title: 'Provider Billing Statement', componentKey: 'PrintableBillingStatement', pageIndex: 0 },
      { pageNumber: 3, id: 'tpi-cms-1', type: 'CMS-1500', title: 'CMS-1500 Claim', componentKey: 'CmsRedGridForm', claimIndex: 0 },
      { pageNumber: 4, id: 'tpi-assess', type: 'ASSESSMENT', title: 'FM Trigger Point Assessment', componentKey: 'TpiAssessmentForm' },
      { pageNumber: 5, id: 'tpi-proc-1', type: 'PROCEDURE', title: 'FM Trigger Point Procedure', componentKey: 'TpiProcedureForm', dos: '01/15/2026' }
    ]
  },

  'prov-tecar': {
    providerId: 'prov-tecar',
    providerName: 'FM TECAR Therapy Clinic',
    totalPages: 5,
    pages: [
      { pageNumber: 1, id: 'tecar-cover', type: 'COVER', title: 'Patient & Case Cover Page', componentKey: 'TecarCoverPage' },
      { pageNumber: 2, id: 'tecar-bill-1', type: 'BILLING', title: 'Provider Billing Statement', componentKey: 'PrintableBillingStatement', pageIndex: 0 },
      { pageNumber: 3, id: 'tecar-cms-1', type: 'CMS-1500', title: 'CMS-1500 Claim', componentKey: 'CmsRedGridForm', claimIndex: 0 },
      { pageNumber: 4, id: 'tecar-assess', type: 'ASSESSMENT', title: 'FM TECAR Therapy Assessment', componentKey: 'TecarAssessmentForm' },
      { pageNumber: 5, id: 'tecar-proc-1', type: 'PROCEDURE', title: 'FM TECAR Procedure Log', componentKey: 'TecarProcedureForm', dos: '01/20/2026' }
    ]
  },

  'prov-general': {
    providerId: 'prov-general',
    providerName: 'General Final Treatment',
    totalPages: 1,
    pages: [
      { pageNumber: 1, id: 'general-final', type: 'NARRATIVE', title: 'Final Treatment Report', componentKey: 'PatientFinalTreatmentReport' }
    ]
  }
};

