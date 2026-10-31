import { CURRENT_SCHEMA_VERSION } from './schema/profile.js';

/** Realistic profile covering every section type. Used by "Load sample" and template contract tests. */
export const sampleProfile = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  basics: {
    fullName: 'Ananya Rao',
    headline: 'Senior Backend Engineer',
    email: 'ananya.rao@example.com',
    phone: '+91 98765 43210',
    location: 'Bengaluru, India',
    photo: null,
    links: [
      { id: 'lnk_github', label: 'GitHub', url: 'https://github.com/ananyarao' },
      { id: 'lnk_linkedin', label: 'LinkedIn', url: 'https://www.linkedin.com/in/ananyarao/' },
    ],
  },
  summary:
    'Backend engineer with 8 years of experience building payment and ledger systems at scale. Focused on reliability, clear service boundaries, and mentoring teams through large migrations.',
  sections: [
    {
      id: 'sec_experience',
      type: 'experience',
      title: 'Experience',
      items: [
        {
          id: 'exp_finpay',
          role: 'Senior Backend Engineer',
          organization: 'FinPay',
          location: 'Bengaluru',
          startDate: '2021-04',
          endDate: '',
          current: true,
          bullets: [
            'Led migration of the ledger service to an event-sourced design, cutting reconciliation time from 6 hours to 20 minutes.',
            'Designed idempotent payout APIs handling 2M requests per day at 99.99% availability.',
            'Mentored 5 engineers; introduced design reviews adopted across 4 teams.',
          ],
        },
        {
          id: 'exp_shopline',
          role: 'Software Engineer',
          organization: 'ShopLine',
          location: 'Hyderabad',
          startDate: '2017-07',
          endDate: '2021-03',
          current: false,
          bullets: [
            'Built the order pipeline on Kafka and PostgreSQL, scaling from 5k to 120k orders per day.',
            'Reduced p95 checkout latency by 40% through query and cache redesign.',
          ],
        },
      ],
    },
    {
      id: 'sec_education',
      type: 'education',
      title: 'Education',
      items: [
        {
          id: 'edu_nitw',
          degree: 'B.Tech',
          field: 'Computer Science and Engineering',
          institution: 'National Institute of Technology, Warangal',
          location: 'Warangal',
          startDate: '2013-07',
          endDate: '2017-05',
          grade: '8.7 CGPA',
          bullets: [],
        },
      ],
    },
    {
      id: 'sec_skills',
      type: 'skills',
      title: 'Skills',
      items: [
        { id: 'skl_go', name: 'Go', category: 'Languages', level: '' },
        { id: 'skl_java', name: 'Java', category: 'Languages', level: '' },
        { id: 'skl_python', name: 'Python', category: 'Languages', level: '' },
        { id: 'skl_pg', name: 'PostgreSQL', category: 'Data', level: '' },
        { id: 'skl_kafka', name: 'Kafka', category: 'Data', level: '' },
        { id: 'skl_k8s', name: 'Kubernetes', category: 'Infrastructure', level: '' },
        { id: 'skl_aws', name: 'AWS', category: 'Infrastructure', level: '' },
      ],
    },
    {
      id: 'sec_projects',
      type: 'projects',
      title: 'Projects',
      items: [
        {
          id: 'prj_ledgerlite',
          name: 'ledgerlite',
          role: 'Author',
          url: 'https://github.com/ananyarao/ledgerlite',
          startDate: '2022',
          endDate: '',
          description: 'Open-source double-entry ledger library for Go.',
          technologies: ['Go', 'PostgreSQL'],
          bullets: ['1.2k GitHub stars; used in production by three startups.'],
        },
      ],
    },
    {
      id: 'sec_certifications',
      type: 'certifications',
      title: 'Certifications',
      items: [
        {
          id: 'crt_aws',
          name: 'AWS Certified Solutions Architect – Associate',
          issuer: 'Amazon Web Services',
          date: '2023-02',
          expiryDate: '2026-02',
          credentialId: '',
          url: '',
        },
      ],
    },
    {
      id: 'sec_achievements',
      type: 'achievements',
      title: 'Achievements',
      items: [
        {
          id: 'ach_award',
          title: 'Engineering Excellence Award',
          issuer: 'FinPay',
          date: '2023',
          description: 'For leading the ledger migration with zero customer-facing incidents.',
        },
      ],
    },
    {
      id: 'sec_volunteering',
      type: 'custom',
      title: 'Volunteering',
      items: [
        {
          id: 'cus_codeclub',
          heading: 'Mentor',
          subheading: 'Code Club Bengaluru',
          location: '',
          startDate: '2019-01',
          endDate: '',
          current: true,
          description: 'Weekend programming sessions for high-school students.',
          bullets: [],
        },
      ],
    },
  ],
};
