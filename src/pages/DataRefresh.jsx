import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Clock, CheckCircle2, XCircle, Loader2, Calendar } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function DataRefresh() {
  const [refreshing, setRefreshing] = useState(false);
  const [daysOld, setDaysOld] = useState(30);
  const [batchSize, setBatchSize] = useState(10);
  const [result, setResult] = useState(null);

  const startRefresh = async () => {
    setRefreshing(true);
    setResult(null);
    
    try {
      const response = await base44.functions.invoke('refreshTargetData', {
        daysOld: parseInt(daysOld),
        batchSize: parseInt(batchSize)
      });

      setResult(response.data);
    } catch (error) {
      setResult({
        success: false,
        error: error.message
      });
    }
    
    setRefreshing(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <RefreshCw className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Data Refresh</h1>
          <p className="text-slate-600">Automatically update and refresh target data</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manual Refresh</CardTitle>
          <CardDescription>
            Refresh targets that haven't been updated recently
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Refresh targets older than (days)</Label>
              <Input
                type="number"
                value={daysOld}
                onChange={(e) => setDaysOld(e.target.value)}
                min="1"
                max="365"
              />
            </div>
            <div className="space-y-2">
              <Label>Batch size</Label>
              <Input
                type="number"
                value={batchSize}
                onChange={(e) => setBatchSize(e.target.value)}
                min="1"
                max="50"
              />
            </div>
          </div>

          <Button
            onClick={startRefresh}
            disabled={refreshing}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {refreshing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Refreshing Data...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Start Refresh
              </>
            )}
          </Button>

          {result && (
            <Alert className={result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <AlertDescription>
                {result.error ? (
                  <div className="text-red-800">
                    <strong>Error:</strong> {result.error}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-green-800 font-medium">
                      {result.message}
                    </div>
                    
                    {result.results && (
                      <div className="space-y-2">
                        <div className="flex gap-4 text-sm">
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            {result.results.success} succeeded
                          </Badge>
                          {result.results.errors > 0 && (
                            <Badge className="bg-red-100 text-red-800">
                              <XCircle className="w-3 h-3 mr-1" />
                              {result.results.errors} failed
                            </Badge>
                          )}
                        </div>

                        <div className="max-h-48 overflow-y-auto">
                          {result.results.details.map((detail, idx) => (
                            <div key={idx} className="text-sm py-1 border-b border-slate-200 last:border-0">
                              <span className="font-medium">{detail.name}:</span>{' '}
                              {detail.status === 'success' ? (
                                <span className="text-green-700">
                                  ✓ Updated {detail.updated.join(', ')}
                                </span>
                              ) : (
                                <span className="text-red-700">
                                  ✗ {detail.error}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Automated Refresh Schedule
          </CardTitle>
          <CardDescription>
            A weekly automation refreshes old targets automatically
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="text-blue-800">
              <div className="space-y-2">
                <div>
                  <strong>Schedule:</strong> Every Sunday at 2:00 AM
                </div>
                <div>
                  <strong>Targets:</strong> Refreshes up to 10 targets older than 30 days
                </div>
                <div>
                  <strong>Updates:</strong> Website status, clinic count, growth signals, dormancy flags, and scores
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What Gets Refreshed?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="flex gap-2 items-start">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <div className="font-medium">Website Status</div>
                <div className="text-sm text-slate-600">Re-check if sites are working</div>
              </div>
            </div>
            <div className="flex gap-2 items-start">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <div className="font-medium">Clinic Count</div>
                <div className="text-sm text-slate-600">Update location counts</div>
              </div>
            </div>
            <div className="flex gap-2 items-start">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <div className="font-medium">Growth Signals</div>
                <div className="text-sm text-slate-600">Detect recent expansions</div>
              </div>
            </div>
            <div className="flex gap-2 items-start">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <div className="font-medium">Dormancy Flags</div>
                <div className="text-sm text-slate-600">Mark inactive companies</div>
              </div>
            </div>
            <div className="flex gap-2 items-start">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <div className="font-medium">Fit Scores</div>
                <div className="text-sm text-slate-600">Recalculate based on new data</div>
              </div>
            </div>
            <div className="flex gap-2 items-start">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <div className="font-medium">Last Active Date</div>
                <div className="text-sm text-slate-600">Track recent activity</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}