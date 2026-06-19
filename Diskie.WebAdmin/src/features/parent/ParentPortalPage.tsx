import { Card, CardContent, Chip, Grid, Stack, Typography } from '@mui/material'
import ShieldIcon from '@mui/icons-material/Shield'
import ChildCareIcon from '@mui/icons-material/ChildCare'
import PrivacyTipIcon from '@mui/icons-material/PrivacyTip'
import { PageHeader } from '../../components/PageHeader'
import { useAuth } from '../../auth/AuthContext'

export function ParentPortalPage() {
  const { childId } = useAuth()

  return (
    <>
      <PageHeader
        title="Parent Portal"
        description="Restricted child-only access. Data is scoped by ChildId claim."
        action={<Chip icon={<ShieldIcon />} label="Child-Scoped Access" color="primary" />}
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <CardContent>
              <Stack spacing={1.5}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Child Restricted View
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Your session token carries a ChildId claim. Backend global query
                  filters must use this claim to return only your child's records.
                </Typography>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                  <Chip icon={<ChildCareIcon />} label={`ChildId: ${childId ?? 'Unknown'}`} />
                  <Chip icon={<PrivacyTipIcon />} label="PII Protected" variant="outlined" />
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                Safety Notes
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This view should never expose cross-child data. Any API call used here
                must rely on ChildId claims, not client-sent IDs.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  )
}
