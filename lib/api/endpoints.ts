export const ENDPOINTS = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    refreshToken: '/auth/refresh-token',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    profile: '/auth/profile',
    changePassword: '/auth/change-password',
    logout: '/auth/logout'
  },
  customers: {
    root: '/customers',
    search: '/customers/search',
    byId: (id: string) => `/customers/${id}`,
    installations: (id: string) => `/customers/${id}/installations`,
    history: (id: string) => `/customers/${id}/history`,
    documents: (id: string) => `/customers/${id}/documents`,
    document: (id: string, documentId: string) => `/customers/${id}/documents/${documentId}`
  },
  installations: {
    root: '/installations',
    suggestedBOM: '/installations/suggested-bom',
    byId: (id: string) => `/installations/${id}`,
    materials: (id: string) => `/installations/${id}/materials`,
    reverseMaterial: (id: string, usageId: string) => `/installations/${id}/materials/${usageId}/reverse`,
    bomPdf: (id: string) => `/installations/${id}/bom-pdf`,
    bomExcel: (id: string) => `/installations/${id}/bom-excel`,
    status: (id: string) => `/installations/${id}/status`,
    loadAnalysis: (id: string) => `/installations/${id}/load-analysis`
  },
  materials: {
    root: '/materials',
    lowStock: '/materials/low-stock',
    summary: '/materials/summary',
    search: '/materials/search',
    byId: (id: string) => `/materials/${id}`,
    image: (id: string) => `/materials/${id}/image`,
    history: (id: string) => `/materials/${id}/history`,
    stock: (id: string) => `/materials/${id}/stock`
  },
  purchases: {
    root: '/purchases',
    byId: (id: string) => `/purchases/${id}`,
    invoice: (id: string) => `/purchases/${id}/invoice`,
    complete: (id: string) => `/purchases/${id}/complete`
  },
  suppliers: {
    root: '/suppliers',
    byId: (id: string) => `/suppliers/${id}`,
    purchases: (id: string) => `/suppliers/${id}/purchases`,
    bulk: '/suppliers/bulk',
    performance: '/suppliers/analysis/performance'
  },
  notifications: {
    root: '/notifications',
    unreadCount: '/notifications/unread-count',
    read: (id: string) => `/notifications/${id}/read`,
    readAll: '/notifications/read-all',
    external: '/notifications/external',
    pmSuryaGhar: '/notifications/external/pm-surya-ghar',
    unified: '/notifications/unified'
  },
  bomTemplates: {
    root: '/bom-templates',
    byRoofType: '/bom-templates/by-roof-type',
    byId: (id: string) => `/bom-templates/${id}`,
    bulk: '/bom-templates/bulk'
  },
  quotations: {
    root: '/quotations',
    /** next number the next save will receive (read-only preview) */
    nextNumber: '/quotations/next-number',
    /** is a hand-typed number still free? (read-only, nothing reserved) */
    checkNumber: '/quotations/check-number',
    /** Quotation SL Number register - mirrors the old Excel sheet */
    register: '/quotations/register',
    /** fixed terms / payment terms and the form defaults (read only) */
    defaults: '/quotations/defaults',
    stats: '/quotations/stats',
    byId: (id: string) => `/quotations/${id}`,
    status: (id: string) => `/quotations/${id}/status`,
    restore: (id: string) => `/quotations/${id}/restore`,
    pdf: (id: string) => `/quotations/${id}/pdf`,
    print: (id: string) => `/quotations/${id}/print`,
    attachments: (id: string) => `/quotations/${id}/attachments`,
    attachment: (id: string, attachmentId: string) => `/quotations/${id}/attachments/${attachmentId}`,
    importRegister: '/quotations/import/register',
    importAttachments: '/quotations/import/attachments',
    importConfirm: '/quotations/import/confirm'
  },
  agreements: {
    root: '/agreements',
    /** discom, registered office and the fixed 50/40/10 wording */
    defaults: '/agreements/defaults',
    byId: (id: string) => `/agreements/${id}`,
    /** the four page document */
    pdf: (id: string) => `/agreements/${id}/pdf`,
    print: (id: string) => `/agreements/${id}/print`
  },
  /** Field agent accounts — every route here is admin only. */
  agents: {
    root: '/agents',
    /** Will the welcome / reset emails actually go out? */
    emailStatus: '/agents/email-status',
    /** Verifies the SMTP handshake without sending anything. */
    emailTest: '/agents/email-test',
    byId: (id: string) => `/agents/${id}`,
    activate: (id: string) => `/agents/${id}/activate`,
    resetPassword: (id: string) => `/agents/${id}/reset-password`
  },
  /**
   * Consumer applications. An agent only ever sees their own; admin/manager see
   * everything and may narrow with `?agent=`.
   */
  applications: {
    root: '/applications',
    stats: '/applications/stats',
    /** The form definition: documents, site types, statuses, bill portal URL. */
    checklist: '/applications/checklist',
    /** The credit rules per lender, so the client shows the numbers the server uses. */
    lenderCriteria: '/applications/lender-criteria',
    /** The credit verdict before an application exists — nothing is stored. */
    creditCheck: '/applications/credit-check',
    byId: (id: string) => `/applications/${id}`,
    submit: (id: string) => `/applications/${id}/submit`,
    documents: (id: string) => `/applications/${id}/documents`,
    document: (id: string, documentId: string) => `/applications/${id}/documents/${documentId}`,
    documentReview: (id: string, documentId: string) =>
      `/applications/${id}/documents/${documentId}/review`,
    electricBill: (id: string) => `/applications/${id}/electric-bill`,
    electricBillPortal: (id: string) => `/applications/${id}/electric-bill/portal`,
    electricBillVerify: (id: string) => `/applications/${id}/electric-bill/verify`,
    nameMatch: (id: string) => `/applications/${id}/name-match`,
    review: (id: string) => `/applications/${id}/review`,
    status: (id: string) => `/applications/${id}/status`,
    signedDocument: (id: string) => `/applications/${id}/signed-document`
  },
  health: '/health'
};
