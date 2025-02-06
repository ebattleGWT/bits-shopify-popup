import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import {
  Page,
  Layout,
  Card,
  DataTable,
  Select,
  Text,
  Grid,
  BlockStack,
  Box,
  ProgressBar,
  Button,
} from "@shopify/polaris";
import { useEffect, useState } from "react";
import { Chart } from "react-google-charts";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const { id } = params;

  if (!session?.shop) {
    throw new Response("Unauthorized", { status: 401 });
  }

  return json({ popupId: id });
}

export default function PopupAnalytics() {
  const { popupId } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [period, setPeriod] = useState("7d");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  async function fetchAnalytics() {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics?popupId=${popupId}&period=${period}`);
      const data = await response.json();
      setData(data);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    }
    setLoading(false);
  }

  if (loading || !data) {
    return (
      <Page
        title="Popup Analytics"
        backAction={{
          content: "Back to popup",
          onAction: () => navigate(`/app/popups/${popupId}`),
        }}
      >
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="p">Loading analytics...</Text>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  const metrics = data.metrics[0] || {
    impressions: 0,
    clicks: 0,
    conversions: 0,
    closeCount: 0,
    clickRate: 0,
    conversionRate: 0,
    deviceBreakdown: {},
    countryBreakdown: {},
    pageBreakdown: {},
  };

  const timeSeriesData = [
    ["Date", "Impressions", "Clicks", "Conversions", "Closes"],
    ...data.timeSeries.map((item: any) => [
      item.date,
      item.IMPRESSION || 0,
      item.CLICK || 0,
      item.CONVERSION || 0,
      item.CLOSE || 0,
    ]),
  ];

  return (
    <Page
      title="Popup Analytics"
      backAction={{
        content: "Back to popup",
        onAction: () => navigate(`/app/popups/${popupId}`),
      }}
      secondaryActions={[
        {
          content: "Refresh",
          onAction: fetchAnalytics,
        },
      ]}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Box padding="400">
                <Select
                  label="Time period"
                  options={[
                    { label: "Last 24 hours", value: "24h" },
                    { label: "Last 7 days", value: "7d" },
                    { label: "Last 30 days", value: "30d" },
                    { label: "All time", value: "all" },
                  ]}
                  value={period}
                  onChange={setPeriod}
                />
              </Box>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Grid>
            <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6 }}>
              <Card>
                <BlockStack gap="200">
                  <Text variant="headingMd" as="h3">Impressions</Text>
                  <Text variant="headingLg" as="p">{metrics.impressions}</Text>
                </BlockStack>
              </Card>
            </Grid.Cell>
            <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6 }}>
              <Card>
                <BlockStack gap="200">
                  <Text variant="headingMd" as="h3">Clicks</Text>
                  <Text variant="headingLg" as="p">{metrics.clicks}</Text>
                  <Text variant="bodySm" as="p">({metrics.clickRate}% CTR)</Text>
                </BlockStack>
              </Card>
            </Grid.Cell>
            <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6 }}>
              <Card>
                <BlockStack gap="200">
                  <Text variant="headingMd" as="h3">Conversions</Text>
                  <Text variant="headingLg" as="p">{metrics.conversions}</Text>
                  <Text variant="bodySm" as="p">({metrics.conversionRate}% CVR)</Text>
                </BlockStack>
              </Card>
            </Grid.Cell>
            <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6 }}>
              <Card>
                <BlockStack gap="200">
                  <Text variant="headingMd" as="h3">Closes</Text>
                  <Text variant="headingLg" as="p">{metrics.closeCount}</Text>
                </BlockStack>
              </Card>
            </Grid.Cell>
          </Grid>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h3">Performance Over Time</Text>
              <Chart
                chartType="LineChart"
                width="100%"
                height="400px"
                data={timeSeriesData}
                options={{
                  hAxis: { title: "Date" },
                  vAxis: { title: "Count" },
                  series: {
                    0: { color: "#5c6ac4" },
                    1: { color: "#47c1bf" },
                    2: { color: "#50b83c" },
                    3: { color: "#de3618" },
                  },
                }}
              />
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Grid>
            <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6 }}>
              <Card>
                <BlockStack gap="400">
                  <Text variant="headingMd" as="h3">Device Breakdown</Text>
                  {Object.entries(metrics.deviceBreakdown).map(([device, count]: [string, any]) => (
                    <Box key={device}>
                      <BlockStack gap="200">
                        <Text variant="bodyMd" as="p">{device}</Text>
                        <ProgressBar
                          progress={(count / metrics.impressions) * 100}
                          size="small"
                        />
                        <Text variant="bodySm" as="p">{count} views ({Math.round((count / metrics.impressions) * 100)}%)</Text>
                      </BlockStack>
                    </Box>
                  ))}
                </BlockStack>
              </Card>
            </Grid.Cell>

            <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6 }}>
              <Card>
                <BlockStack gap="400">
                  <Text variant="headingMd" as="h3">Top Pages</Text>
                  <DataTable
                    columnContentTypes={["text", "numeric", "numeric"]}
                    headings={["Page", "Views", "Conversion Rate"]}
                    rows={Object.entries(metrics.pageBreakdown)
                      .sort(([, a]: [string, any], [, b]: [string, any]) => b - a)
                      .slice(0, 5)
                      .map(([page, views]: [string, any]) => {
                        const pageEvents = data.events.filter((e: any) => e.page === page);
                        const conversions = pageEvents.filter((e: any) => e.eventType === "CONVERSION").length;
                        const conversionRate = views > 0 ? (conversions / views) * 100 : 0;
                        return [
                          page,
                          views,
                          `${Math.round(conversionRate * 100) / 100}%`,
                        ];
                      })}
                  />
                </BlockStack>
              </Card>
            </Grid.Cell>
          </Grid>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h3">Recent Events</Text>
              <DataTable
                columnContentTypes={["text", "text", "text", "text"]}
                headings={["Time", "Event", "Device", "Page"]}
                rows={data.events.slice(0, 10).map((event: any) => [
                  new Date(event.createdAt).toLocaleString(),
                  event.eventType,
                  event.deviceType || "Unknown",
                  event.page || "Unknown",
                ])}
              />
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
} 