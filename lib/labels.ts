/**
 * Human-readable label expansions for acronyms and technical codes
 * used throughout the application UI.
 */

export const INSTRUMENT_LABELS: Record<string, string> = {
  QCBS: 'Quality and Cost-Based Selection (QCBS)',
  QBS:  'Quality-Based Selection (QBS)',
  LCS:  'Least-Cost Selection (LCS)',
  FBS:  'Fixed Budget Selection (FBS)',
  CQS:  'Consultant Qualification Selection (CQS)',
  SSS:  'Single Source Selection (SSS)',
  ICB:  'International Competitive Bidding (ICB)',
  NCB:  'National Competitive Bidding (NCB)',
  TA:   'Technical Assistance',
  Loan: 'Loan',
  Grant: 'Grant',
  Humanitarian: 'Humanitarian Aid',
}

export const DONOR_LABELS: Record<string, string> = {
  IDA:  'International Development Association (IDA)',
  IBRD: 'International Bank for Reconstruction and Development (IBRD)',
  AIIB: 'Asian Infrastructure Investment Bank (AIIB)',
  FCDO: 'Foreign, Commonwealth and Development Office (FCDO)',
  DFID: 'Department for International Development (DFID) — now FCDO',
  GIZ:  'Deutsche Gesellschaft für Internationale Zusammenarbeit (GIZ)',
  KfW:  'KfW Development Bank (Germany)',
  AFD:  'Agence Française de Développement (AFD)',
  JICA: 'Japan International Cooperation Agency (JICA)',
  KOICA:'Korea International Cooperation Agency (KOICA)',
  TIKA: 'Turkish Cooperation and Coordination Agency (TIKA)',
  SDC:  'Swiss Agency for Development and Cooperation (SDC)',
  MDB:  'Multilateral Development Bank',
  UNDP: 'United Nations Development Programme (UNDP)',
  UNICEF: 'United Nations Children\'s Fund (UNICEF)',
  UNFPA: 'United Nations Population Fund (UNFPA)',
  WFP:  'World Food Programme (WFP)',
  FAO:  'Food and Agriculture Organization (FAO)',
  WHO:  'World Health Organization (WHO)',
  UNESCO: 'United Nations Educational, Scientific and Cultural Organization (UNESCO)',
  UNRWA: 'United Nations Relief and Works Agency (UNRWA)',
  IFAD: 'International Fund for Agricultural Development (IFAD)',
  IsDB: 'Islamic Development Bank (IsDB)',
  GCF:  'Green Climate Fund (GCF)',
  GGGI: 'Global Green Growth Institute (GGGI)',
  ACIAR:'Australian Centre for International Agricultural Research (ACIAR)',
  IWMI: 'International Water Management Institute (IWMI)',
}

export const STATUS_LABELS: Record<string, string> = {
  active:      'Active',
  closing:     'Closing Soon',
  closed:      'Closed',
  frozen:      'Frozen',
  pipeline:    'Pipeline',
  open:        'Open',
  evaluation:  'Under Evaluation',
  awarded:     'Awarded',
  cancelled:   'Cancelled',
}

/** Expand an acronym label, falling back to the original if not found */
export function expandInstrument(code: string | null | undefined): string {
  if (!code) return ''
  return INSTRUMENT_LABELS[code] ?? code
}

export function expandDonor(code: string | null | undefined): string {
  if (!code) return ''
  return DONOR_LABELS[code] ?? code
}
