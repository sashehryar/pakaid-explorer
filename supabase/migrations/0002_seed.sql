-- PakAid Explorer — Seed Data
-- Substantive Pakistan development sector data for demo + initial use

-- ─────────────────────────────────────────────────────────────
-- PROJECTS
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.projects (title, donor, sector, province, amount_usd, status, instrument, start_date, end_date, implementer, iati_id, context_note, opportunity_note, source, featured) VALUES
('Resilient Institutions and Sustainable Economy (RISE)', 'World Bank', 'Governance', 'Federal', 500000000, 'active', 'Loan', '2023-06-01', '2028-05-31', 'Finance Division / FBR', 'P179060', 'Core WB fiscal reform programme tied to IMF EFF. FBR tax admin TA is a key sub-component.', 'Subcontracting open for fiscal advisory TA. OPM and Palladium both bidding.', 'WB', TRUE),
('KP Flood Emergency Reconstruction', 'World Bank', 'Infrastructure', 'KP', 120000000, 'active', 'Loan', '2022-07-01', '2026-12-31', 'Government of KP', 'P170928', '2022 flood response. 3 months behind schedule due to procurement delays.', 'WASH infrastructure subcontracts open. PPRA-exempt given emergency status.', 'WB', FALSE),
('Punjab Education Sector Programme', 'World Bank', 'Education', 'Punjab', 350000000, 'active', 'Loan', '2023-07-01', '2028-12-31', 'School Education Department', 'P178234', 'P4R instrument — disbursements tied to learning outcome results. 2024 DLI met.', 'MEL and assessment subcontracts likely Q3 2026. LEAD Pakistan and OPM shortlisted.', 'WB', TRUE),
('Access to Finance for SMEs', 'ADB', 'Finance / Private Sector', 'Federal', 200000000, 'active', 'Loan', '2022-06-01', '2026-05-31', 'SBP / SMEDA', NULL, 'ADB financial sector loan to SBP. SMEDA digitisation sub-component underway.', 'DFI advisory and SME capacity TA needed. ADB procurement notice expected Q2 2026.', 'ADB', FALSE),
('Pakistan Green Climate and Energy Programme', 'GIZ', 'Climate Finance', 'KP / Federal', 35000000, 'active', 'TA', '2023-01-01', '2027-12-31', 'AEDB', 'DE-2023-GIZ-PAK-PGCEP', 'German BMZ flagship in Pakistan. Phase II design underway (~€45M). Best-funded bilateral 2026.', 'Political economy consultancy for PGCEP II design open. GIZ direct procurement — contact KfW desk.', 'GIZ', TRUE),
('Competitive Skills and Employment', 'USAID', 'Economic Growth', 'Federal / Punjab', 65000000, 'frozen', 'Grant', '2021-10-01', '2025-12-31', 'Creative Associates', NULL, 'USAID stop-work order Feb 2025. Programme effectively frozen. ADB TVET partially fills gap.', 'ADB TVET procurement covers some of this gap — check ADB procurement notices.', 'IATI', FALSE),
('FCDO CDPS — Governance & Service Delivery', 'FCDO', 'Governance', 'Federal / Punjab', 85000000, 'active', 'Grant', '2024-01-01', '2027-12-31', 'Palladium Group', 'GB-GOV-1-201938', 'Largest FCDO programme in Pakistan. MEL contract open for competition.', 'MEL Lead role open. Palladium managing but third-party MEL required by FCDO policy.', 'IATI', TRUE),
('Sindh Resilience Project', 'World Bank', 'Climate Resilience', 'Sindh', 400000000, 'active', 'Loan', '2023-03-01', '2028-06-30', 'Sindh P&D Board', 'P176655', 'Post-flood resilience. Drainage and LBOD system upgrade. Largest active WB project in Sindh.', 'Civil works supervision consultancy open. Environment and social safeguards TA needed.', 'WB', FALSE),
('JICA Water Supply and Sanitation Lahore', 'JICA', 'WASH', 'Punjab', 45000000, 'active', 'Loan', '2021-04-01', '2026-03-31', 'WASA Lahore', NULL, 'JICA ODA loan for Lahore WASH infrastructure. Closing in 3 months — extension under discussion.', 'JICA direct procurement model — Japanese firms preferred. Local partner needed for community mobilisation.', 'IATI', FALSE),
('KfW Off-Grid Solar Balochistan', 'KfW', 'Energy', 'Balochistan', 28000000, 'active', 'Grant', '2022-09-01', '2027-08-31', 'Alternative Energy Development Board', NULL, 'KfW off-grid solar for rural Balochistan. Part of German energy transition bilateral.', 'Installation and maintenance subcontracts open to local firms. Community mobilisation required.', 'IATI', FALSE),
('EU NDICI Pakistan — Rule of Law', 'EU', 'Rule of Law', 'Federal', 22000000, 'active', 'Grant', '2023-01-01', '2026-12-31', 'GIZ (delegated)', NULL, 'EU delegated to GIZ. Focuses on access to justice and legal aid. Close to 50% disbursed.', 'Sub-grants to local legal aid organisations open. EU procurement through GIZ — see GIZ Pakistan website.', 'IATI', FALSE),
('AIIB Pakistan Infrastructure Fund', 'AIIB', 'Infrastructure', 'Federal', 150000000, 'pipeline', 'Loan', '2026-07-01', '2031-06-30', 'Ministry of Finance', NULL, 'AIIB pipeline project — formal approval expected Q3 2026. Focus on transport and energy transmission.', 'Early-stage advisory positions available. AIIB uses WB procurement framework.', 'WB', FALSE)
ON CONFLICT (iati_id) DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- TENDERS
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.tenders (title, donor, sector, province, value_usd, deadline, days_left, status, instrument, positioning_note, source_url, source) VALUES
('TVET Reform and Skills Development — Consulting Services', 'World Bank', 'Education', 'Federal', 4200000, '2026-04-30', 32, 'open', 'QCBS', 'Lead with Punjab employer partnerships. WB wants private sector co-investment model. Consortium with ASI or Palladium strengthens bid.', 'https://projects.worldbank.org/procurement', 'WB'),
('Punjab Solar Micro-Grid — Engineering Supervision', 'ADB', 'Energy', 'Punjab', 1800000, '2026-05-15', 47, 'open', 'QCBS', 'ADB requires IFC Performance Standards compliance. Firms with ESHS track record have edge. Japanese or Korean partners improve chances.', 'https://www.adb.org/work-with-us/opportunities', 'ADB'),
('FCDO CDPS MEL Framework — Third-Party Monitoring', 'FCDO', 'Governance', 'Federal', 3500000, '2026-04-20', 22, 'open', 'Grant', 'FCDO requires politically smart MEL. Real-time adaptive management framework is the differentiator. DFID-experienced firms preferred.', 'https://devtracker.fcdo.gov.uk', 'FCDO'),
('UNICEF WASH Supply Chain — Framework Agreement', 'UNICEF', 'WASH', 'National', 2100000, '2026-04-12', 14, 'open', 'Grant', 'UNGM registered vendors only. Framework covers 3 years — high volume if awarded. Local manufacturing required for 60% of items.', 'https://www.ungm.org', 'UN'),
('GIZ PGCEP — Renewable Energy Policy Advisory', 'GIZ', 'Climate Finance', 'Federal', 850000, '2026-05-01', 33, 'open', 'TA', 'GIZ direct procurement. Policy advisory for NEPRA and AEDB reform. German or EU firms preferred. Local partner mandatory.', 'https://www.giz.de', 'GIZ'),
('EU NDICI KP Livelihoods — Sub-Grant Facility', 'EU', 'Economic Growth', 'KP', 1200000, '2026-04-25', 27, 'open', 'Grant', 'EU open to civil society and hybrid firms. Results-based payment model. KP local presence is a hard requirement.', 'https://webgate.ec.europa.eu', 'EU'),
('IsDB Pakistan Grid Rehabilitation — TA', 'IsDB', 'Energy', 'Federal', 620000, '2026-06-30', 93, 'open', 'TA', 'IsDB prefers OIC member country firms. Pakistani and Turkish JVs well-positioned. MoP counterpart engagement critical.', 'https://www.isdb.org', 'IsDB'),
('WB RISE FBR Tax Administration — Consulting', 'World Bank', 'Governance', 'Federal', 2800000, '2026-04-08', 10, 'open', 'QCBS', 'Under RISE DLI 3. IMF-adjacent work — firms with fiscal reform track record in IDA countries preferred. OPM and KPMG shortlisted.', 'https://projects.worldbank.org', 'WB'),
('ADB Sindh Urban Services — Design Consultancy', 'ADB', 'Infrastructure', 'Sindh', 3100000, '2026-03-20', 0, 'evaluation', 'QCBS', NULL, 'https://www.adb.org', 'ADB'),
('FCDO Punjab Literacy — Implementation Partner', 'FCDO', 'Education', 'Punjab', 5500000, '2026-02-28', 0, 'evaluation', 'Grant', NULL, 'https://devtracker.fcdo.gov.uk', 'FCDO'),
('WB KP Road Maintenance — Civil Works Supervision', 'World Bank', 'Infrastructure', 'KP', 1600000, '2026-01-15', 0, 'awarded', NULL, NULL, 'https://projects.worldbank.org', 'WB'),
('ADB Access to Finance — SME Capacity TA', 'ADB', 'Finance / Private Sector', 'Federal', 950000, '2026-02-01', 0, 'awarded', NULL, NULL, 'https://www.adb.org', 'ADB'),
('EU Pakistan Trade Corridors — Evaluation', 'EU', 'Trade', 'Federal', 420000, '2026-01-30', 0, 'awarded', NULL, NULL, 'https://webgate.ec.europa.eu', 'EU')
ON CONFLICT DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- DONORS
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.donors (name, type, country, active_projects, volume_label, historical_volume_usd, instrument, sectors, provinces, opportunity_note, pain_point, entry_path, procurement_model, website) VALUES
('World Bank', 'MDB', 'USA', 28, '$3.2B active', 12000000000, 'Loan / Grant / P4R', ARRAY['Governance','Education','Health','Infrastructure','Climate','Finance'], ARRAY['Federal','Punjab','Sindh','KP','Balochistan'], 'RISE programme TA subcontracts open Q2 2026. 3 new loans in pipeline for FY27.', 'GoP counter-part fund release delays cause disbursement slippage. 3 projects 12+ months behind.', 'STEP procurement system for consulting. QCBS >$300K. Register at worldbank.org/STEP.', 'QCBS for consulting; ICB/NCB for goods; P4R for results-based', 'https://www.worldbank.org/en/country/pakistan'),
('ADB', 'MDB', 'Philippines', 18, '$2.1B active', 8000000000, 'Loan / Grant / TA', ARRAY['Energy','Transport','Agriculture','Finance','Education','WASH'], ARRAY['Federal','Punjab','KP','Sindh'], 'TVET and agriculture sector pipeline strong for 2026-27. New energy transition facility being designed.', 'ESHS compliance weak in GoP counterparts creates supervision burden. Procurement delays common.', 'ADB Procurement notices at adb.org. QCBS for consulting. National Competitive Bidding for smaller contracts.', 'QCBS; NCB/ICB for goods and civil works', 'https://www.adb.org/countries/pakistan/main'),
('FCDO', 'Bilateral', 'UK', 12, '$320M active', 1500000000, 'Grant', ARRAY['Governance','Education','Health','Rule of Law','Girls Education'], ARRAY['Federal','Punjab','KP'], 'CDPS Phase II design starting 2026. Girls education pilot in Balochistan likely 2027.', 'Post-Brexit budget pressure. Pakistan ODA envelope reduced ~20% in 2024 SR. Delivery partner margins under pressure.', 'DevTracker for programme info. FCDO Open Contracting. ITTs on Jaggaer/Delta eSourcing.', 'Competitive grant; open tender; framework agreements', 'https://devtracker.fcdo.gov.uk'),
('GIZ', 'Bilateral', 'Germany', 9, '$145M active', 600000000, 'TA / Grant', ARRAY['Climate Finance','Governance','Energy','Agriculture','Decentralisation'], ARRAY['Federal','KP','Punjab'], 'PGCEP Phase II design underway — largest opportunity in Pakistan 2026. BMZ budget growing.', 'GoP policy window narrow for energy reform. Security situation limits KP field operations.', 'GIZ Pakistan directly. Firms must register with GIZ Germany. Direct award for <€100K; tender for larger.', 'Restricted tender; direct procurement for TA', 'https://www.giz.de/en/worldwide/pakistan.html'),
('USAID', 'Bilateral', 'USA', 3, '$180M (frozen)', 3000000000, 'Grant', ARRAY['Health','Education','Economic Growth','Democracy','Agriculture'], ARRAY['Federal','KP','Sindh'], 'Stop-work orders on most programmes. WB and EU absorbing some gap but not all. Watch for reinstatement.', 'Feb 2025 stop-work orders. $845M in programme funding frozen. Chemonics, DAI, Creative all affected.', 'USAIDs Pakistan mission suspended. Monitor FPDS.gov for any re-activation.', 'RFPs on beta.sam.gov; cooperative agreements for NGOs', 'https://www.usaid.gov/pakistan'),
('EU', 'Bilateral', 'EU', 8, '$180M active', 900000000, 'Grant', ARRAY['Rule of Law','Trade','Civil Society','Climate','Migration'], ARRAY['Federal','KP','Balochistan','Sindh'], 'NDICI Phase II negotiations underway. €250M envelope for 2025-2027 being finalised.', 'EU procurement is slow (12-18 months from concept to contract). Long procurement cycles frustrate partners.', 'EU Delegations publish ITTs on EuropeAid. Framework contracts for evaluation and TA available.', 'PRAG procedures; restricted tenders; direct awards for <€75K', 'https://www.eeas.europa.eu/pakistan'),
('JICA', 'Bilateral', 'Japan', 7, '$420M active', 2000000000, 'Loan / Grant / TA', ARRAY['Infrastructure','WASH','Agriculture','Education','Disaster Risk'], ARRAY['Punjab','KP','Sindh','Federal'], 'New ODA package under discussion for post-flood recovery. Healthcare and urban infrastructure focus.', 'Japanese firms strongly preferred for major contracts. Local partners needed for community-level work.', 'JICA Pakistan office directly. Grant aid tenders via Embassy. Japanese procurement procedures apply.', 'Japanese ODA procurement; E/N-based; Japanese firms preferred', 'https://www.jica.go.jp/pakistan/'),
('UNDP', 'UN', 'UN', 11, '$95M active', 500000000, 'Grant / TA', ARRAY['Governance','Climate','Rule of Law','Livelihoods','SDGs'], ARRAY['Federal','Balochistan','KP','Sindh'], 'SDG Acceleration Framework under design. Climate finance facilitation growing.', 'Budget uncertainty. Voluntary contributions declining. Cost recovery model creates friction with partners.', 'UNDP Pakistan website for ITTs. UNGM registration required. Local content requirements strict.', 'UNGM competitive tenders; direct contracting for emergencies', 'https://www.pk.undp.org'),
('IsDB', 'MDB', 'Saudi Arabia', 5, '$380M active', 1800000000, 'Loan / Grant / TA', ARRAY['Education','Energy','Infrastructure','Agriculture','Social'], ARRAY['Federal','KP','Balochistan','AJK'], 'Pakistan is 2nd largest IsDB borrower. Education and energy focus for 2026-27 cycle.', 'OIC preference in procurement creates limited competition. Slow disbursement relative to approval.', 'IsDB website for procurement. OIC member firms preferred. Arabic language capacity useful.', 'OIC preference; restricted international competitive bidding', 'https://www.isdb.org/'),
('GCF', 'Climate', 'South Korea', 2, '$130M active', 280000000, 'Grant / Concessional Loan', ARRAY['Climate Finance','Resilience','Energy','Agriculture'], ARRAY['Federal','Sindh','Balochistan'], 'Second GCF project in pipeline for 2026. Sindh drought resilience and Balochistan water security.', 'Complex accreditation requirements. Only NDMA and Ministry of Finance have direct access as national implementing entities.', 'GCF funded activities requires accredited national entity. Work through NDMA or SBP as national executing entity.', 'GCF Accredited Entities; competitive bidding through AE', 'https://www.greenclimate.fund/'),
('Karandaaz', 'Private', 'Pakistan', 6, 'PKR 4.2B active', 20000000, 'Grant / Investment', ARRAY['Finance / Private Sector','Fintech','SME','Agriculture Finance'], ARRAY['Federal','Punjab','KP','Sindh'], 'New 3-year strategy focuses on agri-finance and microfinance. Direct grant applications open Q2 2026.', 'Limited public procurement. Grant decisions made by investment committee — relationship-based entry.', 'Karandaaz.com.pk for open calls. Relationship with programme teams at Board level important.', 'Direct grant / investment; expression of interest calls', 'https://karandaaz.com.pk')
ON CONFLICT (name) DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- IMF ACTIONS
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.imf_actions (region, action, deadline, status, intelligence_note) VALUES
('Federal', 'Tax-to-GDP reach 13%', '2026-06-30', 'amber', 'FBR Q3 collection 8.9% of GDP. Enforcement gap due to hiring freeze. Q4 push needed.'),
('Federal', 'SOE divestment — 3 entities (PIA, DISCOs, Steel)', '2025-12-31', 'red', 'Delayed via cabinet. PIA transaction stalled. Finance Ministry pushing for Q2 2026.'),
('Federal', 'Energy subsidy rationalisation — circular debt cap', '2026-03-31', 'amber', 'Circular debt ceiling breached Q2. NEPRA tariff determination delayed 6 weeks.'),
('Federal', 'NFC vertical transfers cap', '2026-06-30', 'green', 'Finance Division on track. NFC formula renegotiation proceeding with provinces.'),
('Federal', 'SBP autonomy (no MoF borrowing)', '2025-12-31', 'green', 'SBP Amendment Act passed. Direct MoF borrowing eliminated. IMF satisfied.'),
('Federal', 'BISP coverage — 9M households', '2026-06-30', 'amber', 'BISP at 7.8M. Graduation pilot unresolved. Targeting reform causing delays.'),
('Punjab', 'OSR 15% growth target', '2026-06-30', 'amber', 'Punjab at 8% OSR growth vs 15% target. Urban Immovable Property Tax reform lagging.'),
('Punjab', 'Non-development expenditure cap', '2026-03-31', 'red', 'CM social spending exceeds austerity cap in Q2. Finance Dept in dispute with CM Secretariat.'),
('KP', 'FATA-KP integration fiscal plan', '2026-12-31', 'amber', 'NFC working group on merged districts ongoing. Timeline tight for 2026 review.'),
('KP', 'Ghost employee audit', '2026-06-30', 'red', 'Initial scan shows 25% discrepancy in merged district payroll. Audit firm appointed.'),
('Sindh', 'Agricultural income tax', '2026-06-30', 'amber', 'Legislation passed but enforcement mechanism not yet operational. FBR-SRB coordination needed.'),
('Balochistan', 'Revenue diversification plan', '2027-06-30', 'red', 'No credible plan submitted. FC transfers remain 92% of total revenue. IMF pressing hard.')
ON CONFLICT DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- USAID GAP PROGRAMS
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.usaid_gap_programs (program_id, title, sector, value_usd, end_date, fill_level, fill_source, gap_usd, gap_note, implementer, province) VALUES
('EGBR', 'Energy Governance and Budget Reform', 'Governance', 85000000, '2024-09-30', 'Partial', 'WB RISE Programme (partial)', 45000000, 'WB RISE covers fiscal reform but not energy sector governance. NEPRA capacity TA gap remains unfilled.', 'Chemonics', 'Federal'),
('MCHP', 'Maternal and Child Health Programme', 'Health', 120000000, '2024-12-31', 'Partial', 'Gates Foundation MNCH (partial)', 72000000, 'Gates covers MNCH research and immunisation but not health systems strengthening at facility level.', 'JHPIEGO', 'Sindh / KP'),
('SBEP', 'Sindh Basic Education Programme', 'Education', 95000000, '2025-03-31', 'None', NULL, 95000000, 'No replacement identified. FCDO and WB assessing but no commitment. 2.1M children at risk of losing access.', 'RTI International', 'Sindh'),
('SERROL', 'Strengthening Electoral and Rule of Law', 'Rule of Law', 42000000, '2025-06-30', 'None', NULL, 42000000, 'Rule of law programming effectively absent. EU Human Rights programme does not cover electoral systems.', 'IFES', 'Federal'),
('PRP', 'Pakistan Reading Programme', 'Education', 148000000, '2025-09-30', 'Partial', 'FCDO CDPS literacy component (partial)', 89000000, 'FCDO CDPS has literacy sub-component at 1/6th scale. 59% gap in foundational literacy programming remains.', 'International Rescue Committee', 'KP / Punjab'),
('SIMA', 'Strengthening Integrated Monitoring and Accountability', 'Governance', 38000000, '2025-12-31', 'None', NULL, 38000000, 'No donor has stepped into accountability/CSO strengthening. This is the largest unaddressed governance gap.', 'DAI Global', 'Federal'),
('TRACE', 'Transparent and Accountable Civil Engagement', 'Civil Society', 28000000, '2025-06-30', 'None', NULL, 28000000, 'Civil society and media freedom programming entirely unfilled. EU Media Freedom component is not equivalent.', 'INTERNEWS', 'Federal'),
('ADF', 'Agriculture and Diversification Finance', 'Agriculture', 75000000, '2025-09-30', 'Partial', 'ASI Punjab Agriculture DTL (partial)', 30000000, 'ASI covers Punjab only. KP and Sindh smallholder finance gap = 40% of original programme.', 'Adam Smith International', 'Punjab'),
('CSE', 'Competitive Skills and Employment', 'Economic Growth', 65000000, '2025-12-31', 'Partial', 'ADB TVET (partial)', 35000000, 'ADB TVET covers technical skills but not entrepreneurship or private sector linkages that USAID CSE provided.', 'Creative Associates', 'Federal / Punjab'),
('EPP', 'Export Promotion Programme', 'Trade', 32000000, '2025-03-31', 'None', NULL, 32000000, 'IFC trade finance work does not cover market access and export promotion. No equivalent identified.', 'DAI Global', 'Federal'),
('FPI', 'Flood and Pandemic Insurance', 'Climate Resilience', 55000000, '2025-06-30', 'Full', 'WB DRFIP (full replacement)', 0, 'World Bank DRFIP fully replaces catastrophe risk finance. No gap.', 'World Bank', 'Federal'),
('MEDIA', 'Independent Media and Journalism', 'Media / Democracy', 22000000, '2025-09-30', 'None', NULL, 22000000, 'No donor committed to independent media support. EU Democracy programme is policy-focused, not media operations.', 'INTERNEWS', 'Federal')
ON CONFLICT (program_id) DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- OVERLAP RECORDS
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.overlap_records (iati_id, title, donor, implementer, sector, province, instrument, start_date, end_date, amount_usd, keywords, source) VALUES
('GB-GOV-1-201938', 'Pakistan Skills Development Programme', 'FCDO', 'British Council', 'Education', 'Punjab', 'Grant', '2022-01-01', '2026-06-30', 45000000, ARRAY['TVET','skills','vocational','youth employment','Punjab'], 'IATI'),
('P170928', 'KP Emergency Recovery Project', 'World Bank', 'Government of KP', 'WASH / Infrastructure', 'KP', 'Loan', '2022-07-01', '2026-12-31', 120000000, ARRAY['flood','WASH','infrastructure','reconstruction','KP','emergency'], 'WB'),
('ADB-PKS-2021-0034', 'Punjab Rural Roads and Water Supply', 'ADB', 'Punjab P&D Board', 'Infrastructure', 'Punjab', 'Loan', '2021-04-01', '2025-12-31', 300000000, ARRAY['roads','rural','water supply','infrastructure','Punjab'], 'ADB'),
('GB-GOV-1-202145', 'Strengthening Primary Healthcare KP', 'FCDO', 'HEAL Pakistan', 'Health', 'KP', 'Grant', '2023-01-01', '2027-03-31', 28000000, ARRAY['primary health','BHU','maternal health','KP','health systems'], 'IATI'),
('EU-2022-PKS-003', 'Rural Livelihoods and Food Security Sindh', 'EU', 'Agri-Reach', 'Agriculture', 'Sindh', 'Grant', '2022-09-01', '2025-08-31', 18000000, ARRAY['food security','agriculture','smallholder','rural livelihoods','Sindh'], 'IATI'),
('P176655', 'Sindh Resilience Project', 'World Bank', 'Sindh P&D Board', 'Climate Resilience', 'Sindh', 'Loan', '2023-03-01', '2028-06-30', 400000000, ARRAY['flood resilience','Sindh','drainage','climate','LBOD'], 'WB'),
('ADB-PKS-2022-0041', 'Access to Finance for SMEs', 'ADB', 'SBP / SMEDA', 'Finance / Private Sector', 'Federal', 'Loan', '2022-06-01', '2026-05-31', 200000000, ARRAY['SME','finance','private sector','access to finance','banking'], 'ADB'),
('GIZ-PAK-PGCEP-01', 'Pakistan Green Climate and Energy Programme', 'GIZ', 'AEDB', 'Climate Finance', 'KP / Federal', 'TA', '2023-01-01', '2027-12-31', 35000000, ARRAY['climate','renewable energy','green','PGCEP','KP','energy'], 'IATI'),
('P178234', 'Punjab Education Sector Programme', 'World Bank', 'School Education Department', 'Education', 'Punjab', 'Loan', '2023-07-01', '2028-12-31', 350000000, ARRAY['education','school','Punjab','learning outcomes','P4R'], 'WB')
ON CONFLICT (iati_id) DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- SALARY BENCHMARKS
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.salary_benchmarks (role, level, min_pkr, max_pkr, usd_equivalent, notes) VALUES
('Programme Officer', 'Entry', 120000, 180000, '$430–640/mo', 'Local NGO or INGO implementing partner. Islamabad/Lahore base.'),
('Programme Manager', 'Mid', 250000, 400000, '$890–1,400/mo', 'INGO or consulting firm. 5-7 years experience. Project management certification preferred.'),
('Team Leader / COP', 'Senior', 600000, 1200000, '$2,100–4,300/mo', 'INGO or donor-funded programme. 10+ years. Local rates lower than expat equivalent.'),
('MEL Specialist', 'Mid', 200000, 380000, '$710–1,350/mo', 'Monitoring evaluation and learning. Demand high from FCDO, WB, ADB programmes.'),
('Procurement/Finance Officer', 'Entry', 100000, 160000, '$360–570/mo', 'All donor-funded programmes. High turnover role.'),
('Senior Policy Advisor', 'Director', 800000, 1800000, '$2,850–6,400/mo', 'Governance and fiscal reform. IMF-adjacent roles at highest end.'),
('UN National Officer (NOB)', 'UN NO', 400000, 600000, '$1,430–2,140/mo', 'UN Pakistan. NOB scale. Competitive for local market. Benefits package adds ~40%.'),
('UN International Officer (P3)', 'UN P3', 1200000, 1800000, '$4,285–6,430/mo', 'International staff. Islamabad duty station. Hardship classification D adds 15%.'),
('Consultant (Expat, Daily Rate)', 'Senior', 1400000, 2500000, '$5,000–8,900/mo', 'Short-term technical assistance. Daily rates: $500-900 for senior international experts.')
ON CONFLICT DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- CONSULTING FIRMS
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.consulting_firms (name, type, trend, hiring_status, editorial_note, headcount, revenue_signal, active_contracts, key_programmes, donors, opportunity_note, risk_note) VALUES
('Palladium Group', 'Consulting', 'Growing', 'Active — governance, health, MEL', 'Largest FCDO CDPS beneficiary in Pakistan 2024–27. Bidding Phase II of multiple programmes due 2026.', '~180 Pakistan staff', 'FCDO CDPS contract win (~£85M) driving growth. USAID freeze created partial drag.', 7, ARRAY['FCDO CDPS','WB RISE (sub)','FCDO MNCH'], ARRAY['FCDO','WB','USAID'], 'Actively recruiting MEL leads and governance advisors. LinkedIn shows 12 open roles.', NULL),
('DAI Global', 'Consulting', 'Contracting', 'Cautious — USAID freeze impact', 'Lost 3 USAID contracts to freeze. Aggressively pursuing WB and EU to backfill. Net headcount reduction of ~40.', '~120 Pakistan staff (was 160)', 'Revenue down ~25% YoY. USAID CSE and MCHP closures the main drivers.', 4, ARRAY['USAID MCHP (winding)','WB AgriFinance (sub)','EU SME Corridor'], ARRAY['USAID','WB','EU'], NULL, 'Two more USAID contracts have stop-work orders pending. Worst-case: 60 more redundancies.'),
('Adam Smith International', 'Consulting', 'Stable', 'Active — ADB Punjab agriculture', 'Strong pipeline in economic governance and agriculture. Winning ADB work that DAI/Palladium miss.', '~75 Pakistan staff', 'ADB Punjab Agriculture win (DTL contract) adds stability through 2028.', 5, ARRAY['ADB Punjab Agriculture DTL','FCDO Fiscal TA','WB FBR Reform (sub)'], ARRAY['ADB','FCDO','WB'], 'Hiring Deputy Team Leader, agriculture specialists, and digital extension advisors for ADB contract.', NULL),
('GIZ Pakistan', 'Consulting', 'Growing', 'Expanding — PGCEP Phase II pipeline', 'Best-resourced bilateral programme in Pakistan 2026. German BMZ budget increases benefiting GIZ Pakistan directly.', '~200 Pakistan staff', 'PGCEP Phase II design underway (~€45M). Energy transition portfolio expanding.', 9, ARRAY['PGCEP Climate','Decentralisation FATA','Renewable Energy TA','EU NDICI delegated'], ARRAY['GIZ/BMZ','EU'], 'Largest subcontracting opportunity in Pakistan 2026. Political economy consultancy open for PGCEP II design.', NULL),
('Oxford Policy Management', 'Consulting', 'Growing', 'Active — fiscal reform TA pipeline', 'IMF-adjacent work expanding sharply. FBR reform, tax admin, BISP graduation — all OPM sweet spots.', '~55 Pakistan staff', 'WB RISE sub-contract for FBR TA confirmed. Two more bids shortlisted.', 3, ARRAY['WB RISE FBR TA','FCDO BISP Graduation','FCDO NFC Fiscal Review'], ARRAY['WB','FCDO'], 'Recruiting tax administration specialists and social protection economists. 5 open roles.', NULL),
('LEAD Pakistan', 'Research', 'Stable', 'Active — research and evaluation', 'Premier local research institution. FCDO, WB, and EU all use LEAD for Pakistan-specific analysis and MEL.', '~90 Pakistan staff', 'Stable grant income from multiple donors. Gates Foundation climate/agriculture grant renewed.', 6, ARRAY['FCDO CDPS MEL','WB P4R Assessment','Gates AgriRes'], ARRAY['FCDO','WB','Gates Foundation','EU'], 'Best entry point for Pakistani professionals wanting research careers. Regular researcher and analyst openings.', NULL),
('Tetra Tech', 'Consulting', 'Contracting', 'Reduced — USAID WASH cuts', 'USAID WASH and infrastructure portfolio closures hitting hard. Pivoting to EU and ADB but slowly.', '~60 Pakistan staff (was 95)', 'Three USAID contracts terminated Q4 2025. ADB WASH bid pending — critical for survival.', 2, ARRAY['ADB Rural WASH (bidding)','USAID KP WASH (winding)'], ARRAY['USAID','ADB'], NULL, 'If ADB WASH bid fails, likely Pakistan office closure or significant downsizing.')
ON CONFLICT (name) DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- PSDP ITEMS
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.psdp_items (category, name, allocation_bn, released_bn, spent_bn, execution_pct, target_pct, province, risk, key_project, note, fiscal_year) VALUES
('federal', 'Energy', 398, 251, 198, 50, 85, NULL, 'high', 'DISCOs Distribution Upgrade', 'CPEC energy projects lagging. Circular debt overhang and DISCO privatisation uncertainty.', '2025-26'),
('federal', 'Transport / NHA', 312, 245, 228, 73, 85, NULL, 'low', 'N-55 Motorway Extension', 'NHA highways ahead of target. ML-1 railway still on hold pending Chinese financing.', '2025-26'),
('federal', 'Water (WAPDA)', 287, 198, 162, 56, 80, NULL, 'medium', 'Diamer-Bhasha Dam Phase 2', 'Diamer-Bhasha progressing. Mohmand Dam 3 months behind schedule.', '2025-26'),
('federal', 'Higher Education (HEC)', 95, 72, 71, 75, 80, NULL, 'low', 'University Infrastructure Phase V', 'HEC development ahead of Q3 target. Research grants fully disbursed.', '2025-26'),
('federal', 'Health (NHSRC)', 78, 52, 45, 58, 75, NULL, 'medium', 'Teaching Hospitals Upgradation', 'Import-dependent equipment procurement delays causing slippage.', '2025-26'),
('federal', 'Railways (ML-1)', 35, 8, 6, 17, 70, NULL, 'high', 'ML-1 Upgradation (CPEC)', 'ML-1 effectively frozen pending finalisation of Chinese EXIM loan terms.', '2025-26'),
('provincial', 'Punjab', 680, NULL, 462, 68, 85, 'Punjab', 'medium', NULL, 'Roads, health BHUs, schools rehabilitation. 17pp behind target.', '2025-26'),
('provincial', 'KP', 320, NULL, 166, 52, 75, 'KP', 'high', NULL, 'Post-flood recovery and merged districts. Security constraints limiting field work.', '2025-26'),
('provincial', 'Sindh', 510, NULL, 332, 65, 80, 'Sindh', 'medium', NULL, 'Karachi infrastructure, drainage, rural WASH. Execution improving from low base.', '2025-26'),
('provincial', 'Balochistan', 245, NULL, 93, 38, 60, 'Balochistan', 'high', NULL, 'Roads, water supply, basic services. 22pp behind target. Lowest execution nationally.', '2025-26'),
('ministry', 'Ministry of Energy (Power)', 245, NULL, 118, 48, 80, NULL, 'high', 'DISCOs Distribution Upgrade', 'Circular debt overhang constraining execution. DISCO sale uncertainty.', '2025-26'),
('ministry', 'Ministry of Communications (NHA)', 198, NULL, 152, 77, 80, NULL, 'low', 'N-55 Motorway Extension', 'On track. NHA performing above sector average.', '2025-26'),
('ministry', 'WAPDA', 187, NULL, 112, 60, 80, NULL, 'medium', 'Diamer-Bhasha Dam Phase 2', 'Slightly behind. Dam construction progressing, procurement for Phase 3 underway.', '2025-26'),
('ministry', 'Ministry of Railways', 85, NULL, 14, 16, 70, NULL, 'high', 'ML-1 Upgradation (CPEC)', 'ML-1 effectively frozen. Chinese EXIM loan terms not finalised.', '2025-26'),
('ministry', 'HEC', 95, NULL, 71, 75, 80, NULL, 'low', 'University Infrastructure Phase V', 'Ahead of target. Research grants and university capex on track.', '2025-26')
ON CONFLICT DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- REGULATORY ENTRIES
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.regulatory_entries (category, title, body, authority, last_updated, complexity, tags) VALUES
('NGO Registration', 'Federal INGO Registration — EAD', 'International NGOs (INGOs) operating in Pakistan must register with the Economic Affairs Division (EAD) under the Policy for Regulation of INGOs 2015 (amended 2022). Registration takes 3–6 months and requires: MOU with a Government Ministry, programme framework, audited accounts, and CEO approval by Interior Ministry. Local NGOs register with SECP as Section 42 companies or under the Societies Registration Act 1860.', 'EAD (Federal) / SECP', 'Jan 2026', 'High', ARRAY['INGO','Registration','EAD','SECP','Compliance']),
('Tax & Finance', 'Tax Exemption for NGOs — Section 2(36) and Clause 58(b)', 'NGOs registered under Section 2(36) of the Income Tax Ordinance 2001 may apply for tax exemption on donations and charitable income. Clause 58(b) entities (Second Schedule) receive full exemption. Requirements: annual audit by FBR-approved firm, no distribution of profits, Form III filed annually. USAID and FCDO grants are typically exempt from withholding tax under bilateral tax agreements. GIZ and EU projects also benefit from diplomatic tax exemptions.', 'FBR — Large Taxpayer Office', 'Feb 2026', 'High', ARRAY['Tax','FBR','Exemption','Grants','Finance']),
('Tax & Finance', 'Withholding Tax on Procurement and Salaries', 'All entities including NGOs must deduct withholding tax on: (a) salaries above PKR 600K/year, (b) services procurement — 3% from registered, 6% from unregistered vendors (Section 153), (c) rent above PKR 15K/month — 15%. Donor-funded projects sourcing goods internationally may apply for customs duty exemption via EAD MOU. Monthly withholding statements due 15th of following month.', 'FBR — Inland Revenue', 'Jan 2026', 'Medium', ARRAY['Withholding Tax','FBR','Procurement','Salaries']),
('Procurement', 'PPRA Rules 2004 — Federal Procurement Framework', 'All federal government and donor-co-financed procurement above PKR 100K must follow PPRA Rules 2004. Key thresholds: Open tender (PKR 2M+), RFQ (PKR 100K–2M), Direct procurement (under PKR 100K). Donor projects using WB, ADB, or other multilateral funds follow the donor procurement framework which supersedes PPRA under loan/grant agreements. PPRA Rules apply to counterpart funds and government-executed components.', 'PPRA', 'Mar 2026', 'Medium', ARRAY['PPRA','Procurement','Tendering','Federal']),
('Procurement', 'WB Procurement Framework (PPSD)', 'World Bank-financed projects use 2016 Procurement Regulations (PPSD). For consulting: QCBS for >$300K. For goods: ICB for >$5M, NCB below. Consultants must be on WB-eligible lists with no conflict of interest. ADB uses similar framework: QCBS for consultants, ICB/NCB for goods — see ADB Procurement Policy 2017.', 'World Bank / ADB', 'Nov 2025', 'High', ARRAY['World Bank','ADB','QCBS','ICB','Consulting']),
('Foreign Exchange', 'SBP FE Circular 7 — INGO Foreign Currency Accounts', 'INGOs must maintain a dedicated foreign currency account (FCA) with a scheduled bank, approved by SBP. Inward remittances must be surrendered to PKR within 30 days (FE Circular 7/2022), unless SBP exemption obtained. UN agencies and entities covered by bilateral agreements (USAID, FCDO) are typically exempt. PKR depreciation risk: programme budgets in USD should be hedged via SBP-approved forward contracts.', 'State Bank of Pakistan', 'Dec 2025', 'High', ARRAY['SBP','Foreign Exchange','Banking','INGO','FCA']),
('Reporting', 'EAD Annual Progress Report (IPR)', 'Registered INGOs must submit Annual Progress Report (IPR) to EAD by March 31 each year covering: programme activities vs MOU, financial statements, staff details including expatriate visa counts, sub-grant agreements. Failure to file can result in registration suspension. EAD increased enforcement since 2023 — two major INGOs had registrations suspended for incomplete IPRs.', 'EAD — External Finance Wing', 'Feb 2026', 'Medium', ARRAY['EAD','Reporting','INGO','IPR','Compliance']),
('Compliance', 'AML/FATF and KYC for Development Organisations', 'Development organisations are classified as NPOs under AMLA 2010 and must maintain enhanced due diligence for: donations above PKR 1M from new donors, payments to UN Security Council-designated areas, sub-grants to local partners (KYC required). FMU supervises NPO sector. Cash distributions in merged districts or Balochistan require prior approval from district administration.', 'FMU — Financial Monitoring Unit', 'Mar 2026', 'High', ARRAY['AML','FATF','KYC','FMU','NPO','Compliance']),
('Human Resources', 'Expatriate Work Permits and Visa Requirements', 'Foreign nationals working for INGOs/donors require: (a) Employment Visa — minimum 1-year, (b) Work Permit from Ministry of Interior — 30–45 days, (c) NOC from MoFA for certain nationalities (Indian, Israeli require additional clearance). Annual renewal required. EAD MOU facilitates visa for registered INGOs. Security clearance from IB required for KP Merged Districts and Balochistan.', 'Ministry of Interior / MoFA', 'Jan 2026', 'Medium', ARRAY['Visa','Work Permit','Expatriate','HR','Immigration'])
ON CONFLICT DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- SCRAPER LOGS
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.scraper_logs (name, apify_actor_id, status, records_last_run) VALUES
('World Bank Projects API',     'apify/wb-projects',      'healthy',  142),
('ADB Pakistan Projects',       'apify/adb-pak',          'healthy',   38),
('IATI Datastore Pakistan',     'apify/iati-pk',          'healthy',  891),
('FCDO DevTracker',             'apify/fcdo-devtracker',  'healthy',   64),
('EU OPSYS Pakistan',           'apify/eu-opsys',         'healthy',   29),
('GIZ Project Finder',          'apify/giz-finder',       'healthy',   17),
('ReliefWeb Jobs',              'apify/reliefweb-jobs',   'healthy',   23),
('DevNetJobs Pakistan',         'apify/devnetjobs',       'healthy',   18),
('UN Jobs Pakistan',            'apify/un-jobs',          'healthy',   31),
('PPRA Federal Tenders',        'apify/ppra-federal',     'failing',    0),
('EAD Project Pipeline',        'apify/ead-portal',       'failing',    0),
('Dawn Business',               'apify/dawn-business',    'healthy',    8),
('The News Economy',            'apify/thenews-econ',     'healthy',    6),
('WB Procurement Notices',      'apify/wb-procurement',   'healthy',   11),
('ADB Procurement Notices',     'apify/adb-procurement',  'healthy',    7)
ON CONFLICT DO NOTHING;
