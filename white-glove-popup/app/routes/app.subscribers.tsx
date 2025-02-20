import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  DataTable,
  Filters,
  Button,
  ButtonGroup,
  Text,
  Box,
  Banner,
  Pagination,
  Select,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const url = new URL(request.url);
  
  // Get query parameters
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const pageSize = 20;
  const status = url.searchParams.get("status") || "SUBSCRIBED";
  const popupId = url.searchParams.get("popupId");
  const search = url.searchParams.get("search") || "";

  // Build where clause
  const where = {
    shop: session.shop,
    ...(status && { status }),
    ...(popupId && { popupId }),
    ...(search && {
      email: {
        contains: search,
        mode: 'insensitive' as const,
      },
    }),
  };

  // Get total count for pagination
  const totalSubscribers = await prisma.subscriber.count({ where });
  const totalPages = Math.ceil(totalSubscribers / pageSize);

  // Get subscribers with pagination
  const subscribers = await prisma.subscriber.findMany({
    where,
    include: {
      popup: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  // Get popups for filter
  const popups = await prisma.popup.findMany({
    where: { shop: session.shop },
    select: { id: true, name: true },
  });

  return json({
    subscribers,
    popups,
    pagination: {
      page,
      pageSize,
      totalPages,
      totalSubscribers,
    },
  });
}

export default function Subscribers() {
  const { subscribers, popups, pagination } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [queryValue, setQueryValue] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("SUBSCRIBED");
  const [selectedPopup, setSelectedPopup] = useState("");

  // Format date to local string
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Handle filter changes
  const handleFiltersChange = (status: string, popupId: string, search: string) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (popupId) params.set("popupId", popupId);
    if (search) params.set("search", search);
    params.set("page", "1");
    navigate(\`/app/subscribers?\${params.toString()}\`);
  };

  // Handle export
  const handleExport = async () => {
    const subscribers = await prisma.subscriber.findMany({
      where: {
        shop: window.shopify.config.shop,
        status: selectedStatus,
        ...(selectedPopup && { popupId: selectedPopup }),
      },
      include: {
        popup: {
          select: { name: true },
        },
      },
    });

    const csv = [
      ["Email", "Status", "Source", "Popup", "Date"],
      ...subscribers.map(sub => [
        sub.email,
        sub.status,
        sub.source,
        sub.popup.name,
        formatDate(sub.createdAt),
      ])
    ].map(row => row.join(",")).join("\\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "subscribers.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const rows = subscribers.map(subscriber => [
    subscriber.email,
    subscriber.status,
    subscriber.source,
    subscriber.popup.name,
    formatDate(subscriber.createdAt),
    subscriber.metadata ? JSON.parse(subscriber.metadata).deviceType : "Unknown",
  ]);

  return (
    <Page
      title="Email Subscribers"
      subtitle={`${pagination.totalSubscribers} subscribers total`}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <Box padding="400">
              <ButtonGroup>
                <Button onClick={handleExport}>
                  Export CSV
                </Button>
              </ButtonGroup>
            </Box>
            <Box padding="400">
              <Filters
                queryValue={queryValue}
                queryPlaceholder="Search emails"
                onQueryChange={setQueryValue}
                onQueryClear={() => setQueryValue("")}
                onClearAll={() => {
                  setQueryValue("");
                  setSelectedStatus("SUBSCRIBED");
                  setSelectedPopup("");
                  handleFiltersChange("", "", "");
                }}
                filters={[
                  {
                    key: 'status',
                    label: 'Status',
                    filter: (
                      <Select
                        options={[
                          {label: 'Subscribed', value: 'SUBSCRIBED'},
                          {label: 'Unsubscribed', value: 'UNSUBSCRIBED'},
                        ]}
                        value={selectedStatus}
                        onChange={(value) => {
                          setSelectedStatus(value);
                          handleFiltersChange(value, selectedPopup, queryValue);
                        }}
                      />
                    ),
                  },
                  {
                    key: 'popup',
                    label: 'Popup',
                    filter: (
                      <Select
                        options={[
                          {label: 'All popups', value: ''},
                          ...popups.map(popup => ({
                            label: popup.name,
                            value: popup.id,
                          })),
                        ]}
                        value={selectedPopup}
                        onChange={(value) => {
                          setSelectedPopup(value);
                          handleFiltersChange(selectedStatus, value, queryValue);
                        }}
                      />
                    ),
                  },
                ]}
              />
            </Box>
            <DataTable
              columnContentTypes={[
                'text',
                'text',
                'text',
                'text',
                'text',
                'text',
              ]}
              headings={[
                'Email',
                'Status',
                'Source',
                'Popup',
                'Date',
                'Device',
              ]}
              rows={rows}
              footerContent={
                pagination.totalPages > 1 ? (
                  <Box padding="400">
                    <Pagination
                      label={`Page ${pagination.page} of ${pagination.totalPages}`}
                      hasPrevious={pagination.page > 1}
                      onPrevious={() => {
                        const params = new URLSearchParams(window.location.search);
                        params.set("page", (pagination.page - 1).toString());
                        navigate(\`/app/subscribers?\${params.toString()}\`);
                      }}
                      hasNext={pagination.page < pagination.totalPages}
                      onNext={() => {
                        const params = new URLSearchParams(window.location.search);
                        params.set("page", (pagination.page + 1).toString());
                        navigate(\`/app/subscribers?\${params.toString()}\`);
                      }}
                    />
                  </Box>
                ) : null
              }
            />
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
} 