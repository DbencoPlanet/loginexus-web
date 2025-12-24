"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash2, Calculator, Save, Download } from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// 1. Validation Schema (Matches Backend Pydantic)
const quoteSchema = z.object({
  tracking_number: z.string().min(1, "Reference ID required"),
  total_weight: z.coerce.number().min(1, "Weight required"),
  total_volume: z.coerce.number().min(1, "Volume required"),
  stops: z.array(
    z.object({
      sequence_number: z.coerce.number(),
      stop_type: z.enum(["PICKUP", "DROPOFF"]),
      address_line: z.string().min(1, "Address required"),
      city: z.string().min(1, "City required"),
      state: z.string().min(2, "State required"),
      zip_code: z.string().min(5, "Zip required"),
      // We default lat/lon to 0 for now (Frontend doesn't have geocoding yet)
      latitude: z.number().default(0),
      longitude: z.number().default(0),
    })
  ),
  items: z.array(
    z.object({
      description: z.string().min(1, "Description required"),
      quantity: z.coerce.number().min(1),
      weight: z.coerce.number().min(0),
    })
  ),
});

export default function QuotePage() {
  const [quoteResult, setQuoteResult] = useState<number | null>(null);
  const [savedShipmentId, setSavedShipmentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 2. Initialize Form
  const form = useForm<z.infer<typeof quoteSchema>>({
    resolver: zodResolver(quoteSchema) as any | unknown,
    defaultValues: {
      tracking_number: `Q-${Math.floor(Math.random() * 10000)}`, // Random ID
      total_weight: 0,
      total_volume: 0,
      stops: [
        {
          sequence_number: 1,
          stop_type: "PICKUP",
          address_line: "",
          city: "",
          state: "",
          zip_code: "",
        },
        {
          sequence_number: 2,
          stop_type: "DROPOFF",
          address_line: "",
          city: "",
          state: "",
          zip_code: "",
        },
      ],
      items: [{ description: "General Freight", quantity: 1, weight: 0 }],
    },
  });

  // 3. Dynamic Field Arrays
  const {
    fields: stopFields,
    append: appendStop,
    remove: removeStop,
  } = useFieldArray({
    control: form.control,
    name: "stops",
  });

  const {
    fields: itemFields,
    append: appendItem,
    remove: removeItem,
  } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // 4. Submit Handler (Calculate Price)
  async function onCalculate(values: z.infer<typeof quoteSchema>) {
    setLoading(true);
    try {
      // Mock Coordinates for Demo (In real app, use Google Places API here)
      // We manually inject lat/lon for NY->Philly to make the math work on backend
      const mockStops = values.stops.map((stop, index) => ({
        ...stop,
        latitude: index === 0 ? 40.7128 : 39.9526, // First stop NY, others Philly
        longitude: index === 0 ? -74.006 : -75.1652,
      }));

      const payload = { ...values, stops: mockStops };

      const response = await api.post("/api/v1/shipments/quote", payload);
      setQuoteResult(response.data.estimated_price);
      toast.success("Quote calculated successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to calculate quote");
    } finally {
      setLoading(false);
    }
  }

  // 5. Save Handler (Create Shipment)
  async function onSave() {
    setLoading(true); // Add loading state
    const values = form.getValues();
    try {
      const mockStops = values.stops.map((stop, index) => ({
        ...stop,
        latitude: index === 0 ? 40.7128 : 39.9526,
        longitude: index === 0 ? -74.006 : -75.1652,
      }));

      const response = await api.post("/api/v1/shipments", {
        ...values,
        stops: mockStops,
      });

      // Capture the ID
      setSavedShipmentId(response.data.id);

      toast.success("Shipment saved! You can now download the PDF.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save shipment");
    } finally {
      setLoading(false);
    }
  }

  async function onDownload() {
    if (!savedShipmentId) {
      toast.error("Please book the shipment first.");
      return;
    }

    try {
      toast.info("Generating PDF...");
      const response = await api.get(
        `/api/v1/shipments/${savedShipmentId}/quote/pdf`,
        {
          responseType: "blob", // IMPORTANT: Tell Axios this is a file, not JSON
        }
      );

      // Create a virtual link to trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Quote-${savedShipmentId.slice(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error(error);
      toast.error("Failed to download PDF");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* LEFT COLUMN: The Form */}
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Quote</h1>
          <p className="text-slate-500">
            Enter details to get an instant spot rate.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onCalculate)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>General Info</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tracking_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reference ID</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="total_weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Weight (lbs)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* STOPS SECTION */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Stops</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    appendStop({
                      sequence_number: stopFields.length + 1,
                      stop_type: "DROPOFF",
                      address_line: "",
                      city: "",
                      state: "",
                      zip_code: "",
                      latitude: 0,
                      longitude: 0,
                    })
                  }
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Stop
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {stopFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid grid-cols-12 gap-2 items-end border-b pb-4"
                  >
                    <div className="col-span-1 text-sm font-bold pt-4 text-center text-slate-500">
                      #{index + 1}
                    </div>

                    <div className="col-span-3">
                      <FormField
                        control={form.control}
                        name={`stops.${index}.stop_type`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Type</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="PICKUP">Pickup</SelectItem>
                                <SelectItem value="DROPOFF">Dropoff</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-3">
                      <FormField
                        control={form.control}
                        name={`stops.${index}.city`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">City</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name={`stops.${index}.state`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">State</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-red-500"
                        onClick={() => removeStop(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {quoteResult !== null && (
              <div className="grid gap-4">
                {/* Show Book Button only if NOT saved yet */}
                {!savedShipmentId && (
                  <Button
                    onClick={onSave}
                    disabled={loading}
                    className="w-full h-12 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {loading ? "Saving..." : "Book Shipment to Database"}
                  </Button>
                )}

                {/* Show Download Button only AFTER saving */}
                {savedShipmentId && (
                  <div className="space-y-2">
                    <div className="p-3 bg-green-50 text-green-700 text-center rounded-md border border-green-200 text-sm">
                      Shipment Booked Successfully!
                    </div>
                    <Button
                      onClick={onDownload}
                      variant="outline"
                      className="w-full h-12 border-slate-300"
                    >
                      <Download className="mr-2 h-4 w-4" /> Download Official
                      PDF
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                "Calculating..."
              ) : (
                <>
                  <Calculator className="mr-2 h-4 w-4" /> Get Quote
                </>
              )}
            </Button> */}
          </form>
        </Form>
      </div>

      {/* RIGHT COLUMN: The Result */}
      <div className="space-y-6">
        <Card className="bg-slate-900 text-white h-[200px] flex flex-col items-center justify-center">
          <CardHeader>
            <CardTitle className="text-slate-400 font-normal">
              Estimated Cost
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            {quoteResult !== null ? (
              <div className="animate-in fade-in zoom-in duration-300">
                <span className="text-5xl font-bold text-green-400">
                  ${quoteResult}
                </span>
                <p className="text-sm text-slate-400 mt-2">USD - Spot Rate</p>
              </div>
            ) : (
              <div className="text-slate-600">Enter details to see price</div>
            )}
          </CardContent>
        </Card>

        {quoteResult !== null && (
          <div className="grid gap-4">
            <Button variant="outline" className="w-full h-12 border-slate-300">
              <Download className="mr-2 h-4 w-4" /> Download Official PDF
            </Button>
            <Button
              onClick={onSave}
              className="w-full h-12 bg-green-600 hover:bg-green-700 text-white"
            >
              <Save className="mr-2 h-4 w-4" /> Book Shipment Now
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
