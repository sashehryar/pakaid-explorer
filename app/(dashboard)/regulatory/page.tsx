import { redirect } from 'next/navigation'

// /regulatory has been merged into /firms/compliance → Regulatory Guide tab
export default function RegulatoryRedirect() {
  redirect('/firms/compliance')
}
