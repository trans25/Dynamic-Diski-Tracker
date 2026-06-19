import { useRef } from 'react'
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  useTheme,
} from '@mui/material'
import { BarChart } from '@mui/x-charts/BarChart'
import { PieChart } from '@mui/x-charts/PieChart'
import ApartmentIcon from '@mui/icons-material/Apartment'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import BlockIcon from '@mui/icons-material/Block'
import GroupIcon from '@mui/icons-material/Group'
import PersonIcon from '@mui/icons-material/Person'
import CategoryIcon from '@mui/icons-material/Category'
import { PageHeader } from '../../components/PageHeader'
import { StatCard } from '../../components/StatCard'
import { ErrorState, LoadingState } from '../../components/States'
import { useDashboard } from '../../hooks/useSuperAdmin'
import { extractErrorMessage } from '../../api/apiClient'
import { chartColors } from '../../theme/theme'
import { ChartActions } from '../../components/charts/ChartActions'

export function DashboardPage() {
  const theme = useTheme()
  const billingChartRef = useRef<HTMLDivElement>(null)
  const usersByRoleChartRef = useRef<HTMLDivElement>(null)
  const { data, isLoading, isError, error, refetch } = useDashboard()
  const palette =
    theme.palette.mode === 'dark' ? chartColors.dark : chartColors.light

  if (isLoading) {
    return <LoadingState label="Loading dashboard…" />
  }

  if (isError || !data) {
    return (
      <>
        <PageHeader title="Dashboard" description="Platform overview" />
        <ErrorState message={extractErrorMessage(error)} onRetry={refetch} />
      </>
    )
  }

  const billingEntries = Object.entries(data.tenantsByBillingPlan)
  const roleEntries = Object.entries(data.usersByRole)

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Platform-wide metrics across all tenants and users."
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <StatCard
            title="Total Tenants"
            value={data.totalTenants}
            caption={`${data.activeTenants} active`}
            icon={ApartmentIcon}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <StatCard
            title="Active Tenants"
            value={data.activeTenants}
            caption="Currently active"
            icon={CheckCircleIcon}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <StatCard
            title="Suspended Tenants"
            value={data.suspendedTenants}
            caption="Suspended"
            icon={BlockIcon}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <StatCard
            title="Total Users"
            value={data.totalUsers}
            caption={`${data.activeUsers} active`}
            icon={GroupIcon}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <StatCard
            title="Active Users"
            value={data.activeUsers}
            caption="Across all tenants"
            icon={PersonIcon}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <StatCard
            title="Sport Templates"
            value={data.totalSportTemplates}
            caption="Configured templates"
            icon={CategoryIcon}
          />
        </Grid>

        <Grid size={{ xs: 12, lg: 7 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title="Tenants by Billing Plan"
              action={
                <ChartActions
                  chartRef={billingChartRef}
                  fileName="tenants-by-billing-plan"
                  title="Tenants by Billing Plan"
                />
              }
            />
            <CardContent>
              {billingEntries.length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
                  No billing data available
                </Box>
              ) : (
                <Box ref={billingChartRef}>
                  <BarChart
                    height={320}
                    xAxis={[
                      {
                        scaleType: 'band',
                        data: billingEntries.map(([k]) => k),
                      },
                    ]}
                    series={[
                      {
                        data: billingEntries.map(([, v]) => Number(v)),
                        label: 'Tenants',
                        color: palette[0],
                      },
                    ]}
                    showToolbar
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title="Users by Role"
              action={
                <ChartActions
                  chartRef={usersByRoleChartRef}
                  fileName="users-by-role"
                  title="Users by Role"
                />
              }
            />
            <CardContent>
              {roleEntries.length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
                  No user data available
                </Box>
              ) : (
                <Box ref={usersByRoleChartRef}>
                  <PieChart
                    height={320}
                    series={[
                      {
                        data: roleEntries.map(([label, value], index) => ({
                          id: index,
                          value: Number(value),
                          label,
                          color: palette[index % palette.length],
                        })),
                        innerRadius: 50,
                        paddingAngle: 2,
                        cornerRadius: 4,
                      },
                    ]}
                    showToolbar
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  )
}
