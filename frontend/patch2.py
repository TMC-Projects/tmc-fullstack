import re

with open('src/app/portal/trials/[id]/applications/page.tsx', 'r') as f:
    content = f.read()

interface_code = """
interface Criteria {
  id: number;
  name: string;
  weight: number;
  description: string;
  is_active: boolean;
}

export default function TrialApplicationsPage() {"""

content = content.replace("export default function TrialApplicationsPage() {", interface_code)

with open('src/app/portal/trials/[id]/applications/page.tsx', 'w') as f:
    f.write(content)

