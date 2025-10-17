"use client"

import { Viewers } from "./viewers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Users } from "lucide-react"

type ViewerData = {
  id: string
  email: string
  viewed_at: string
}

export default function Analytics({ allViewers, uniqueViewers, allViews }: { allViewers: number, uniqueViewers: number, allViews: ViewerData[] }) {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="pr-4 text-sm font-medium">
              Total Views
            </CardTitle>
            <Activity className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allViewers}</div>
          </CardContent>
        </Card>
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="pr-4 text-sm font-medium">
              Unique Views
            </CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueViewers}</div>
          </CardContent>
        </Card>
      </div>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Recent Views</CardTitle>
          <CardDescription>
            {allViewers > 0
              ? `More information about your views`
              : "No views yet"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Viewers allViews={allViews} />
        </CardContent>
      </Card>
    </div>
  )
}