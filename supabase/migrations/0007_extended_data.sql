-- ================================================================
-- Migration 0007: Extended Firms + Donors Data
-- ================================================================

-- ── Extended Consulting Firms ──────────────────────────────────────────────────
-- Uses upsert so existing records are enriched, not duplicated
INSERT INTO public.consulting_firms
  (name, type, trend, hiring_status, editorial_note, active_contracts, website)
VALUES
  -- International Development & Social Impact
  ('AAN Associates',                           'Consulting',   'Stable',      'Active',    'Specializes in social sector consulting, research, and M&E for international NGOs and donor agencies.',        0, NULL),
  ('Raasta Development Consultants',           'Consulting',   'Stable',      'Active',    'Provides consulting for UNICEF, World Bank, ADB and government bodies across Pakistan.',                      0, NULL),
  ('Global Impact Management Consulting',      'Consulting',   'Stable',      'Active',    'Covers agriculture, disaster relief, education, gender, and public sector governance.',                        0, NULL),
  ('CERP',                                     'Research',     'Growing',     'Active',    'Centre for Economic Research in Pakistan: evidence-based policy, research, and innovation with public/private partners.', 0, 'https://cerp.org.pk'),
  ('Project Procurement International (PPI)',  'Consulting',   'Stable',      'Active',    'Specializes in socio-economic development and environmental consultancy.',                                     0, NULL),
  ('Associates in Development (AiD)',          'Consulting',   'Stable',      'Active',    'Islamabad-based international firm offering multi-disciplinary services in engineering, environment, and social development.', 0, NULL),
  ('VTT Global',                               'Consulting',   'Growing',     'Active',    'Strategy and management consulting focused on technology enablement and large-scale monitoring and evaluation.', 0, NULL),
  ('Semiotics Consultants',                    'Research',     'Stable',      'Active',    'Over 35 years experience in social and economic development project research and consultancy.',                 0, NULL),
  ('Trust Consultancy & Development',          'Consulting',   'Growing',     'Active',    'Established Islamabad office in 2022; empowers local organizations through evidence-based strategies.',        0, NULL),
  ('HIVE Pakistan',                            'Consulting',   'Growing',     'Active',    'Social impact organization for community-led research, social entrepreneurship, and inclusive development.',   0, NULL),

  -- Public Sector & Engineering
  ('NESPAK',                                   'Engineering',  'Stable',      'Active',    'National Engineering Services Pakistan: premier public sector engineering consulting firm established by government.', 0, 'https://nespak.com.pk'),
  ('AASA Consulting',                          'Consulting',   'Stable',      'Active',    'Collaborates with government and international partners like UNICEF and UNDP on social resilience projects.',  0, NULL),
  ('National Development Consultants (NDC)',   'Engineering',  'Stable',      'Active',    'Top consulting engineering firm in Pakistan, handling large-scale public sector water and power projects with WB and ADB.', 0, NULL),
  ('Osmani & Company',                         'Engineering',  'Stable',      'Active',    'Long-standing architectural and engineering services to government agencies and World Bank.',                  0, NULL),
  ('EA Consulting',                            'Engineering',  'Stable',      'Active',    'Frequently pre-qualified for public sector projects in Punjab and Sindh.',                                    0, NULL),
  ('Mott MacDonald Pakistan',                  'Engineering',  'Stable',      'Active',    'Local arm of the global consultancy, involved in public sector health, education, and infrastructure.',        0, 'https://mottmac.com'),
  ('Engineering Consultancy Services Punjab (ECSP)', 'Engineering', 'Stable', 'Active',   'Government-established firm providing consultancy for public and private sector projects in Punjab.',           0, NULL),

  -- Non-Profit Development Networks
  ('RSPN',                                     'Local NGO',    'Stable',      'Active',    'Rural Support Programmes Network: Pakistan''s largest development network focusing on rural development.',     0, 'https://rspn.org.pk'),
  ('Aurat Foundation',                         'Local NGO',    'Stable',      'Active',    'Focuses on gender equality and women''s empowerment across Pakistan.',                                         0, 'https://af.org.pk'),
  ('Akhuwat Foundation',                       'Local NGO',    'Stable',      'Active',    'Microfinance and social development NGO with extensive Pakistan reach.',                                       0, 'https://akhuwat.org.pk'),
  ('ActionAid Pakistan',                       'INGO',         'Stable',      'Active',    'Focuses on social justice and poverty eradication in Pakistan.',                                               0, 'https://actionaid.org/pakistan'),
  ('FHRI',                                     'Local NGO',    'Stable',      'Active',    'Foundation for Human Rights Initiative: works on human rights, climate change, and governance.',              0, NULL),
  ('PIDS',                                     'Local NGO',    'Stable',      'Active',    'Participatory Integrated Development Society: focuses on community-led development in Balochistan.',           0, NULL),
  ('Jaan Pakistan',                            'Local NGO',    'Growing',     'Active',    'Focuses on environmental sustainability and energy solutions.',                                                0, NULL),
  ('SHDWF',                                    'Local NGO',    'Stable',      'Active',    'Sukh Human Development Welfare Foundation: specializes in women''s capacity building and empowerment.',        0, NULL),
  ('Pakistan Poverty Alleviation Fund (PPAF)', 'Local NGO',    'Stable',      'Active',    'Facilitates public-private partnerships to address multi-dimensional poverty across Pakistan.',                0, 'https://ppaf.org.pk'),
  ('Pakistan Centre for Philanthropy (PCP)',   'Local NGO',    'Stable',      'Active',    'Certification agency evaluating performance of non-profits; key compliance partner.',                         0, 'https://pcp.org.pk'),
  ('Social Policy and Development Centre (SPDC)', 'Research',  'Stable',      'Active',    'Karachi-based non-profit providing policy advice on poverty, inequality, and gender for national and provincial governments.', 0, 'https://spdc.org.pk'),
  ('Sarhad Rural Support Programme (SRSP)',    'Local NGO',    'Stable',      'Active',    'Operates in KP and former FATA: community empowerment, livelihoods, and humanitarian response.',              0, NULL),
  ('I-SAPS',                                   'Research',     'Growing',     'Active',    'Institute of Social and Policy Sciences: specializes in education finance and policy; technical advisor to government.', 0, 'https://i-saps.org'),

  -- Strategic Consulting
  ('Delivery Associates',                      'Consulting',   'Growing',     'Active',    'Global delivery and government reform consultancy with public sector expertise.',                              0, 'https://deliveryassociates.com'),
  ('Dalberg',                                  'Consulting',   'Growing',     'Active',    'Global advisory firm focused on creating impact for the most underserved.',                                    0, 'https://dalberg.com'),
  ('Kearney',                                  'Consulting',   'Stable',      'Active',    'Management consulting with research work including bankable feasibilities in Pakistan.',                        0, 'https://kearney.com'),
  ('McKinsey',                                 'Consulting',   'Stable',      'Active',    'Global management consulting with public sector work on tax reform and governance in Pakistan.',               0, 'https://mckinsey.com'),
  ('Acasus',                                   'Consulting',   'Growing',     'Active',    'Development-focused management consulting firm working on health and education systems.',                      0, NULL),
  ('Impetus Advisory Group',                   'Consulting',   'Growing',     'Active',    'Advisory firm focused on development sector strategy and implementation.',                                     0, NULL),

  -- ESG & Specialized
  ('Bridge ESG',                               'Consulting',   'Growing',     'Active',    'Specializes in helping organizations integrate ESG factors and transparent reporting.',                        0, NULL),
  ('Allied Consultants',                       'Consulting',   'Stable',      'Active',    'Provides ESG and sustainability consulting to businesses and organizations in Pakistan.',                      0, NULL),
  ('Mera Maan',                                'Consulting',   'Stable',      'Active',    'Focuses on capacity building, strategy, and training within development contexts.',                           0, NULL),
  ('Sphere Consulting',                        'Consulting',   'Growing',     'Active',    'Public health consulting firm expanded into education and environmental health sectors.',                      0, NULL),
  ('Reenergia',                                'Consulting',   'Growing',     'Active',    'For-profit social impact advisory in energy, climate change, and transport transition.',                       0, NULL),
  ('Rethink Carbon',                           'Consulting',   'Growing',     'Active',    'Boutique firm using AI to streamline decarbonization portfolios and ESG assessments.',                        0, NULL),

  -- Tech & Civic
  ('GlowfishLabs',                             'Consulting',   'Growing',     'Active',    'Lahore-based venture builder and innovation partner; incubates startups and provides tech strategy.',         0, NULL),
  ('Code for Pakistan',                        'Local NGO',    'Growing',     'Active',    'Civic-tech non-profit consulting government on digital public services and citizen engagement.',               0, 'https://codeforpakistan.org'),
  ('LMKT',                                     'Consulting',   'Growing',     'Active',    'Technology and management consulting firm with public sector digital transformation work.',                    0, NULL),

  -- Community & Social Ventures
  ('Together Social Venture Capital',          'Consulting',   'Growing',     'Active',    'Lahore-based firm linking community and NGOs to strengthen social infrastructure.',                           0, NULL),
  ('Professionals in Development Consulting (PIDC)', 'Consulting', 'Stable',  'Active',    'Focused on research, monitoring, and evaluation for international donors and local NGOs.',                    0, NULL),
  ('dev~consult',                              'Consulting',   'Stable',      'Active',    'Niche consultancy providing public health systems design, evaluation, and policy advocacy.',                   0, NULL),
  ('PRIDE Consulting',                         'Consulting',   'Stable',      'Active',    'Works on Social Impact Assessments for major national events including World Bank flood recovery projects.',   0, NULL),
  ('APEX Consulting',                          'Consulting',   'Stable',      'Active',    'Islamabad-based firm offering multidisciplinary expertise to government and donor agencies.',                  0, NULL),
  ('Glow Consultants',                         'Consulting',   'Stable',      'Active',    'Islamabad-based firm specializing in international trade and development research services.',                  0, NULL),
  ('Innovative Development Strategies (IDS)',  'Consulting',   'Stable',      'Active',    'Focuses on analytical and policy support for economic development, poverty alleviation, and rural infrastructure.', 0, NULL)

ON CONFLICT (name) DO UPDATE SET
  editorial_note = COALESCE(EXCLUDED.editorial_note, consulting_firms.editorial_note),
  website        = COALESCE(EXCLUDED.website, consulting_firms.website),
  updated_at     = now();

-- ── Extended Donors ────────────────────────────────────────────────────────────
INSERT INTO public.donors
  (name, type, country, active_projects, website)
VALUES
  -- Bilateral Donors
  ('FCDO',                          'Bilateral', 'United Kingdom',    0, 'https://www.gov.uk/government/organisations/foreign-commonwealth-development-office'),
  ('JICA',                          'Bilateral', 'Japan',             0, 'https://www.jica.go.jp'),
  ('AusAID',                        'Bilateral', 'Australia',         0, 'https://www.dfat.gov.au'),
  ('GIZ',                           'Bilateral', 'Germany',           0, 'https://www.giz.de'),
  ('Global Affairs Canada',         'Bilateral', 'Canada',            0, 'https://www.international.gc.ca'),
  ('Netherlands Embassy Pakistan',  'Bilateral', 'Netherlands',       0, 'https://www.netherlandsworldwide.nl/countries/pakistan'),
  ('Norway NORAD',                  'Bilateral', 'Norway',            0, 'https://www.norad.no'),
  ('Switzerland SDC',               'Bilateral', 'Switzerland',       0, 'https://www.eda.admin.ch/sdc'),
  ('China CPEC Export Credit',      'Bilateral', 'China',             0, NULL),
  ('Saudi Arabia KSRelief',         'Bilateral', 'Saudi Arabia',      0, 'https://ksrelief.org'),
  ('Kuwait Fund',                   'Bilateral', 'Kuwait',            0, 'https://www.kuwait-fund.org'),
  ('Turkey TIKA',                   'Bilateral', 'Turkey',            0, 'https://www.tika.gov.tr'),
  ('South Korea KOICA',             'Bilateral', 'South Korea',       0, 'https://www.koica.go.kr'),
  ('Italy AICS',                    'Bilateral', 'Italy',             0, 'https://www.aics.gov.it'),
  ('France AFD',                    'Bilateral', 'France',            0, 'https://www.afd.fr'),
  ('Germany KfW',                   'Bilateral', 'Germany',           0, 'https://www.kfw-entwicklungsbank.de'),
  ('USAID',                         'Bilateral', 'United States',     0, 'https://www.usaid.gov'),

  -- Multilateral Development Banks
  ('World Bank IDA',                'MDB',       'Global',            0, 'https://www.worldbank.org'),
  ('World Bank IBRD',               'MDB',       'Global',            0, 'https://www.worldbank.org'),
  ('Asian Development Bank',        'MDB',       'Global',            0, 'https://www.adb.org'),
  ('IMF',                           'MDB',       'Global',            0, 'https://www.imf.org'),
  ('IFAD',                          'MDB',       'Global',            0, 'https://www.ifad.org'),
  ('Islamic Development Bank',      'MDB',       'Global',            0, 'https://www.isdb.org'),
  ('AIIB',                          'MDB',       'Global',            0, 'https://www.aiib.org'),
  ('OPEC Fund',                     'MDB',       'Global',            0, 'https://opecfund.org'),

  -- UN & European
  ('European Union',                'Bilateral', 'EU',                0, 'https://www.eeas.europa.eu'),
  ('European Commission',           'Bilateral', 'EU',                0, 'https://commission.europa.eu'),
  ('UNDP',                          'UN',        'Global',            0, 'https://www.undp.org'),
  ('UNICEF',                        'UN',        'Global',            0, 'https://www.unicef.org'),
  ('UNFPA',                         'UN',        'Global',            0, 'https://www.unfpa.org'),
  ('WHO',                           'UN',        'Global',            0, 'https://www.who.int'),
  ('WFP',                           'UN',        'Global',            0, 'https://www.wfp.org'),
  ('UNESCO',                        'UN',        'Global',            0, 'https://www.unesco.org'),
  ('UNRWA',                         'UN',        'Global',            0, 'https://www.unrwa.org'),
  ('FAO',                           'UN',        'Global',            0, 'https://www.fao.org'),
  ('UN Habitat',                    'UN',        'Global',            0, 'https://unhabitat.org'),
  ('UNDCP',                         'UN',        'Global',            0, 'https://www.unodc.org'),

  -- Private Foundations
  ('Bill and Melinda Gates Foundation', 'Private', 'United States',   0, 'https://www.gatesfoundation.org'),
  ('Rockefeller Foundation',        'Private',   'United States',     0, 'https://www.rockefellerfoundation.org'),
  ('Ford Foundation',               'Private',   'United States',     0, 'https://www.fordfoundation.org'),
  ('Aga Khan Foundation',           'Private',   'Global',            0, 'https://www.akdn.org/akf'),
  ('The Asia Foundation',           'Private',   'United States',     0, 'https://asiafoundation.org'),
  ('Acumen Fund',                   'Private',   'United States',     0, 'https://acumen.org'),
  ('Friedrich Ebert Stiftung',      'Private',   'Germany',           0, 'https://www.fes.de'),
  ('Friedrich Naumann Stiftung',    'Private',   'Germany',           0, 'https://www.freiheit.org'),

  -- Climate Finance
  ('Green Climate Fund via NRSP',   'Climate',   'Global',            0, 'https://www.greenclimate.fund'),
  ('GGGI',                          'Climate',   'Global',            0, 'https://www.gggi.org'),

  -- Research & Technical
  ('WaterAid',                      'Private',   'United Kingdom',    0, 'https://www.wateraid.org'),
  ('ACIAR',                         'Bilateral', 'Australia',         0, 'https://www.aciar.gov.au'),
  ('IWMI',                          'Private',   'Global',            0, 'https://www.iwmi.cgiar.org'),
  ('Pakistan Science Foundation',   'Private',   'Pakistan',          0, 'https://psf.gov.pk'),

  -- Pakistan Corporate / Philanthropic
  ('PepsiCo Foundation',            'Private',   'Pakistan',          0, NULL),
  ('Unilever Pakistan',             'Private',   'Pakistan',          0, NULL),
  ('Engro Foundation',              'Private',   'Pakistan',          0, 'https://engrof.org.pk'),
  ('Pakistan Centre for Philanthropy', 'Private','Pakistan',          0, 'https://pcp.org.pk'),
  ('Rangoonwala Foundation',        'Private',   'Pakistan',          0, NULL),
  ('Infaq Foundation',              'Private',   'Pakistan',          0, NULL),
  ('Edhi Foundation',               'Private',   'Pakistan',          0, 'https://edhi.org'),
  ('Kashf Foundation',              'Private',   'Pakistan',          0, 'https://kashf.org'),
  ('Trust for Voluntary Organisations (TVO)', 'Private', 'Pakistan',  0, NULL),
  ('Allied Bank Foundation',        'Private',   'Pakistan',          0, NULL),
  ('Al Baraka Bank Pakistan',       'Private',   'Pakistan',          0, NULL),
  ('ICI Pakistan',                  'Private',   'Pakistan',          0, NULL),
  ('Nestle Pakistan',               'Private',   'Pakistan',          0, NULL),
  ('Telenor Pakistan',              'Private',   'Pakistan',          0, NULL),
  ('JMWM Hussain Foundation',       'Private',   'Pakistan',          0, NULL),
  ('Zia Ul Ummah Foundation',       'Private',   'Pakistan',          0, NULL)

ON CONFLICT (name) DO UPDATE SET
  country    = COALESCE(EXCLUDED.country, donors.country),
  website    = COALESCE(EXCLUDED.website, donors.website),
  updated_at = now();
