import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useAdmin } from '@/admin/context/AdminContext';
import { Save, Image, Building2, Tv, FileText } from 'lucide-react';
import { toast } from 'sonner';

export function SettingsManagement() {
  const { settings, updateSettings } = useAdmin();
  const [formData, setFormData] = useState(settings);

  const handleSave = () => {
    updateSettings(formData);
    toast.success('Settings saved successfully!');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="grid gap-6 max-w-3xl mx-auto">
      {/* Clinic Branding */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">Clinic Branding</CardTitle>
          </div>
          <CardDescription>Manage your clinic's logo, name, and identity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo Upload */}
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              <div className="w-28 h-28 rounded-xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/30">
                {formData.logoUrl ? (
                  <img src={formData.logoUrl} alt="Clinic Logo" className="w-full h-full object-contain p-1" />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <Image className="h-8 w-8" />
                    <span className="text-xs text-center">No logo</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="logo" className="text-sm font-semibold">Clinic Logo</Label>
              <Input id="logo" type="file" accept="image/*" onChange={handleLogoUpload} />
              <p className="text-xs text-muted-foreground">
                Upload PNG, JPG or SVG. This logo appears in the header, prescriptions, and TV display.
              </p>
              {formData.logoUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, logoUrl: '' }))}
                  className="text-destructive hover:text-destructive"
                >
                  Remove Logo
                </Button>
              )}
            </div>
          </div>

          <Separator />

          <div className="grid gap-4">
            <div>
              <Label htmlFor="clinicName">Clinic Name</Label>
              <Input
                id="clinicName"
                value={formData.clinicName}
                onChange={(e) => setFormData(prev => ({ ...prev, clinicName: e.target.value }))}
                placeholder="Balaji Heart Center"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="headerCaption">Header Caption</Label>
                <Input
                  id="headerCaption"
                  value={formData.headerCaption}
                  onChange={(e) => setFormData(prev => ({ ...prev, headerCaption: e.target.value }))}
                  placeholder="Excellence in Cardiac Care"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="footerCaption">Footer Caption</Label>
                <Input
                  id="footerCaption"
                  value={formData.footerCaption}
                  onChange={(e) => setFormData(prev => ({ ...prev, footerCaption: e.target.value }))}
                  placeholder="© 2025 Clinic Name"
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TV Display Settings */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Tv className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">TV Display Settings</CardTitle>
          </div>
          <CardDescription>Customize the waiting room TV display captions</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="tvDisplayTitle">Title (Telugu)</Label>
            <Input
              id="tvDisplayTitle"
              value={formData.tvDisplayTitle}
              onChange={(e) => setFormData(prev => ({ ...prev, tvDisplayTitle: e.target.value }))}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="tvDisplaySubtitle">Subtitle (English)</Label>
            <Input
              id="tvDisplaySubtitle"
              value={formData.tvDisplaySubtitle}
              onChange={(e) => setFormData(prev => ({ ...prev, tvDisplaySubtitle: e.target.value }))}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Prescription Settings */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">Prescription Settings</CardTitle>
          </div>
          <CardDescription>Customize prescription header and footer text</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="prescriptionHeader">Prescription Header</Label>
            <Textarea
              id="prescriptionHeader"
              value={formData.prescriptionHeader}
              onChange={(e) => setFormData(prev => ({ ...prev, prescriptionHeader: e.target.value }))}
              className="mt-1"
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor="prescriptionFooter">Prescription Footer</Label>
            <Textarea
              id="prescriptionFooter"
              value={formData.prescriptionFooter}
              onChange={(e) => setFormData(prev => ({ ...prev, prescriptionFooter: e.target.value }))}
              className="mt-1"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="w-full h-12 text-base font-semibold gap-2">
        <Save className="h-5 w-5" />
        Save All Settings
      </Button>
    </div>
  );
}
