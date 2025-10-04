import { useState, useEffect } from "react";
import { Plus, Trash2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import backend from "@/utils/backendClient";

export function ServiceCatalog() {
  const [open, setOpen] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "rest" as const,
    baseUrl: "",
    authType: "none" as const,
    apiKey: "",
    widgetType: "",
  });

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const data = await backend.catalog.listServices();
      setServices(data.services);
    } catch (error) {
      console.error("Error loading services:", error);
      setServices([]);
    }
  };

  const handleAddService = async () => {
    setLoading(true);
    try {
      await backend.catalog.addService(formData);
      toast({
        title: "Success",
        description: "Service added successfully",
      });
      setOpen(false);
      setFormData({
        name: "",
        description: "",
        type: "rest",
        baseUrl: "",
        authType: "none",
        apiKey: "",
        widgetType: "",
      });
      loadServices();
    } catch (error) {
      console.error("Error adding service:", error);
      toast({
        title: "Error",
        description: "Failed to add service",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (serviceId: string) => {
    try {
      await backend.catalog.deleteService({ serviceId });
      toast({
        title: "Success",
        description: "Service deleted",
      });
      loadServices();
    } catch (error) {
      console.error("Error deleting service:", error);
      toast({
        title: "Error",
        description: "Failed to delete service",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Service Catalog</h2>
          <p className="text-muted-foreground">Manage external APIs and data sources</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Service</DialogTitle>
              <DialogDescription>
                Connect external APIs, MCP servers, or data sources
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Service Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Yahoo Finance API"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What does this service provide?"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Service Type</Label>
                  <Select value={formData.type} onValueChange={(v: any) => setFormData({ ...formData, type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rest">REST API</SelectItem>
                      <SelectItem value="mcp">MCP Server</SelectItem>
                      <SelectItem value="graphql">GraphQL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="authType">Auth Type</Label>
                  <Select value={formData.authType} onValueChange={(v: any) => setFormData({ ...formData, authType: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="apikey">API Key</SelectItem>
                      <SelectItem value="bearer">Bearer Token</SelectItem>
                      <SelectItem value="oauth">OAuth</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="baseUrl">Base URL</Label>
                <Input
                  id="baseUrl"
                  value={formData.baseUrl}
                  onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                  placeholder="https://api.example.com"
                />
              </div>
              {formData.authType !== "none" && (
                <div>
                  <Label htmlFor="apiKey">API Key / Token</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={formData.apiKey}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    placeholder="Enter your API key"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="widgetType">Widget Type (Optional)</Label>
                <Input
                  id="widgetType"
                  value={formData.widgetType}
                  onChange={(e) => setFormData({ ...formData, widgetType: e.target.value })}
                  placeholder="e.g., market-data, sentiment-analysis"
                />
              </div>
              <Button onClick={handleAddService} disabled={loading} className="w-full">
                {loading ? "Adding..." : "Add Service"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <Card key={service.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2">
                  <Globe className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <CardTitle className="text-base">{service.name}</CardTitle>
                    <CardDescription className="text-xs mt-1">{service.type.toUpperCase()}</CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(service.id)}
                  className="h-8 w-8"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">{service.description}</p>
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">URL:</span> {service.baseUrl}
              </p>
              {service.widgetType && (
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="font-medium">Widget:</span> {service.widgetType}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
