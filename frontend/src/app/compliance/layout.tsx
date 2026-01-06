import { ComplianceLayout } from '@/components/compliance'

export default function ComplianceRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ComplianceLayout>{children}</ComplianceLayout>
}
