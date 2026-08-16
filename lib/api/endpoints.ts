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
    purchases: (id: string) => `/suppliers/${id}/purchases`
  },
  notifications: {
    root: '/notifications',
    unreadCount: '/notifications/unread-count',
    read: (id: string) => `/notifications/${id}/read`,
    readAll: '/notifications/read-all'
  },
  bomTemplates: {
    root: '/bom-templates',
    byRoofType: '/bom-templates/by-roof-type',
    byId: (id: string) => `/bom-templates/${id}`,
    bulk: '/bom-templates/bulk'
  },
  health: '/health'
};
