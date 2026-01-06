/**
 * Compliance Pages Index
 *
 * Exports all compliance-related pages and provides routing configuration.
 */

export { default as ComplianceDashboard } from './ComplianceDashboard';
export { default as ControlLibrary } from './ControlLibrary';
export { default as CrossFrameworkAnalysis } from './CrossFrameworkAnalysis';
export { default as TrustworthinessAssessment } from './TrustworthinessAssessment';

// Route configuration for compliance pages
export const complianceRoutes = [
  {
    path: '/compliance',
    element: 'ComplianceDashboard',
    title: 'Compliance Dashboard',
    description: 'Overview of compliance posture across frameworks',
  },
  {
    path: '/compliance/controls',
    element: 'ControlLibrary',
    title: 'Control Library',
    description: '688+ controls across 6 regulatory frameworks',
  },
  {
    path: '/compliance/cross-framework',
    element: 'CrossFrameworkAnalysis',
    title: 'Cross-Framework Analysis',
    description: 'Compare and analyze control mappings',
  },
  {
    path: '/compliance/trustworthiness',
    element: 'TrustworthinessAssessment',
    title: 'Trustworthiness Assessment',
    description: 'Qualitative AI assessment based on 7 EU requirements',
  },
];
