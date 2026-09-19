"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Upload,
  X,
  AlertCircle,
  ShieldAlert,
  Info,
  DollarSign,
  Laptop
} from "lucide-react";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Button from "@/components/ui/button";
import { CATEGORIES } from "@/lib/demo-data";
import { useAuth } from "@/lib/auth-context";
import { dbService } from "@/lib/db";
import { Item, ItemType } from "@/types";
import {
  lostItemSchema,
  foundItemSchema,
  validateImageFile,
  MAX_IMAGE_COUNT
} from "@/lib/validations/item";

interface MultiStepReportFormProps {
  type: ItemType;
}

export const MultiStepReportForm: React.FC<MultiStepReportFormProps> = ({ type }) => {
  const router = useRouter();
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdItem, setCreatedItem] = useState<Item | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Form Fields State
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    color: "",
    brand: "",
    model: "",
    identifyingFeatures: "",
    date: new Date().toISOString().split("T")[0],
    time: "",
    city: "Chennai",
    area: "",
    location: "",
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    reward: "",
    additionalNotes: "",
  });

  // Image Upload State
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);

  const steps = [
    { number: 1, name: "Item Details" },
    { number: 2, name: "When & Where" },
    { number: 3, name: "Photos" },
    { number: 4, name: "Optional Info" },
    { number: 5, name: "Review" },
  ];

  // Image selection handler
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError(null);
    if (!e.target.files) return;

    const filesArray = Array.from(e.target.files);
    
    if (imageFiles.length + filesArray.length > MAX_IMAGE_COUNT) {
      setImageError(`You can upload a maximum of ${MAX_IMAGE_COUNT} images.`);
      return;
    }

    const newFiles: File[] = [];
    const newPreviews: string[] = [];

    for (const file of filesArray) {
      const err = validateImageFile(file);
      if (err) {
        setImageError(err);
        return;
      }
      newFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    setImageFiles((prev) => [...prev, ...newFiles]);
    setImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleRemoveImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Step Validation
  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.title.trim()) newErrors.title = "Item name is required";
      else if (formData.title.length < 3) newErrors.title = "Item name must be at least 3 characters";
      
      if (!formData.category) newErrors.category = "Please select a category";
      
      if (!formData.description.trim()) newErrors.description = "Description is required";
      else if (formData.description.length < 10) newErrors.description = "Description must be at least 10 characters";
    }

    if (step === 2) {
      if (!formData.date) newErrors.date = "Please select the date";
      if (!formData.city.trim()) newErrors.city = "City is required";
      if (!formData.area.trim()) newErrors.area = "Area / neighborhood is required";
      if (!formData.location.trim()) newErrors.location = "Approximate location is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    let activeUser = user;
    if (!activeUser) {
      activeUser = {
        id: "usr-" + Math.random().toString(36).substring(2, 9),
        name: "Anonymous Reporter",
        email: "reporter@findly.app",
        role: "user",
        memberSince: "Member",
      };
      if (typeof window !== "undefined") {
        localStorage.setItem("findly_current_user", JSON.stringify(activeUser));
      }
    }

    // Final validation using Zod
    const schema = type === "lost" ? lostItemSchema : foundItemSchema;
    const parsed = schema.safeParse({
      ...formData,
      reward: formData.reward ? parseFloat(formData.reward) : undefined,
    });

    if (!parsed.success) {
      const formattedErrors: Record<string, string> = {};
      parsed.error.issues.forEach((err: { path: (string | number | symbol)[]; message: string }) => {
        if (err.path[0]) {
          formattedErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(formattedErrors);
      setGeneralError("Please fix the validation errors before submitting.");
      return;
    }

    setIsSubmitting(true);
    try {
      const itemRecord = await dbService.createItem(
        {
          type: type,
          status: "active",
          title: formData.title,
          description: formData.description,
          category: formData.category,
          city: formData.city,
          area: formData.area,
          location: formData.location,
          latitude: formData.latitude,
          longitude: formData.longitude,
          date: formData.date,
          time: formData.time || undefined,
          color: formData.color || undefined,
          brand: formData.brand || undefined,
          model: formData.model || undefined,
          identifyingFeatures: formData.identifyingFeatures || undefined,
          reward: formData.reward ? parseFloat(formData.reward) : undefined,
          additionalNotes: formData.additionalNotes || undefined,
        },
        activeUser.id,
        imageFiles
      );

      setCreatedItem(itemRecord);
      setCurrentStep(6); // Step 6: Success
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit report. Please try again.";
      setGeneralError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // STEP 6: SUCCESS SCREEN
  // -------------------------------------------------------------
  if (currentStep === 6 && createdItem) {
    return (
      <div className="bg-white border border-neutral-100 rounded-3xl p-8 shadow-sm text-center space-y-6 animate-scale-in max-w-xl mx-auto">
        <div className="p-4 bg-success-50 rounded-full text-success-600 w-fit mx-auto border border-success-100">
          <CheckCircle2 className="h-12 w-12" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-neutral-900">
            Your {type === "lost" ? "Lost" : "Found"} Item Has Been Reported!
          </h2>
          <p className="text-sm text-neutral-500 leading-relaxed max-w-md mx-auto">
            {type === "lost"
              ? "Findly will help you discover potential matches as they appear in your community."
              : "Thank you for reporting this item! Your listing is now live for owners to identify."}
          </p>
        </div>

        <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-4 text-left space-y-2">
          <div className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Report Summary</div>
          <div className="grid grid-cols-2 gap-2 text-sm font-medium">
            <span className="text-neutral-500">Title:</span>
            <span className="text-neutral-800 text-right font-bold truncate">{createdItem.title}</span>
            <span className="text-neutral-500">Category:</span>
            <span className="text-neutral-800 text-right">{createdItem.category}</span>
            <span className="text-neutral-500">Location:</span>
            <span className="text-neutral-800 text-right truncate">{createdItem.city}, {createdItem.area}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              setCurrentStep(1);
              setFormData({
                title: "",
                category: "",
                description: "",
                color: "",
                brand: "",
                model: "",
                identifyingFeatures: "",
                date: new Date().toISOString().split("T")[0],
                time: "",
                city: "Chennai",
                area: "",
                location: "",
                latitude: undefined,
                longitude: undefined,
                reward: "",
                additionalNotes: "",
              });
              setImageFiles([]);
              setImagePreviews([]);
              setCreatedItem(null);
            }}
          >
            Report Another Item
          </Button>

          <Link href={`/item/${createdItem.id}`} className="flex-1">
            <Button variant="primary" className="w-full">
              View Item Listing
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-neutral-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-8 max-w-3xl mx-auto">
      
      {/* Progress Stepper Bar */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          {steps.map((step) => (
            <div key={step.number} className="flex items-center gap-2">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                  currentStep === step.number
                    ? "bg-primary-600 text-white shadow-sm"
                    : currentStep > step.number
                    ? "bg-primary-100 text-primary-700 font-extrabold"
                    : "bg-neutral-100 text-neutral-400"
                }`}
              >
                {currentStep > step.number ? "✓" : step.number}
              </div>
              <span
                className={`text-xs font-semibold hidden md:inline ${
                  currentStep === step.number ? "text-neutral-900 font-bold" : "text-neutral-400"
                }`}
              >
                {step.name}
              </span>
            </div>
          ))}
        </div>
        
        <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-primary-600 h-full transition-all duration-300"
            style={{ width: `${(currentStep / 5) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Safety Notice Banner for Found items */}
      {type === "found" && (
        <div className="flex gap-3 p-4 bg-accent-50/50 border border-accent-100 rounded-2xl text-xs text-accent-800 leading-relaxed">
          <ShieldAlert className="h-5 w-5 shrink-0 text-accent-600" />
          <div>
            <p className="font-bold">Public Data Safety Notice</p>
            <p>
              Don&apos;t include private information such as ID card numbers, full credit card details, phone numbers, or passwords in the public report.
            </p>
          </div>
        </div>
      )}

      {/* Error alert */}
      {generalError && (
        <div className="flex gap-2.5 p-4 bg-danger-50 border border-danger-100 rounded-2xl text-xs text-danger-700 font-semibold leading-relaxed">
          <AlertCircle className="h-4.5 w-4.5 shrink-0 text-danger-600" />
          <p>{generalError}</p>
        </div>
      )}

      {/* STEP CONTENT */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* STEP 1: ITEM DETAILS */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-lg font-bold text-neutral-900 border-b border-neutral-50 pb-2">
              Step 1: Item Details
            </h3>

            <Input
              label="Item Name *"
              placeholder={type === "lost" ? "e.g. Silver MacBook Pro 14-inch" : "e.g. Black Leather Wallet"}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              error={errors.title}
            />

            <Select
              label="Category *"
              placeholder="Select category"
              options={CATEGORIES}
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              error={errors.category}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-neutral-700">Detailed Description *</label>
              <textarea
                rows={4}
                placeholder={
                  type === "lost"
                    ? "Describe color, condition, scratches, contents inside, or unique markings..."
                    : "Describe general appearance, condition, and where you found it (keep critical identifying features secret for safety verification)..."
                }
                className={`w-full px-4 py-2.5 bg-white border ${
                  errors.description ? "border-danger-500 focus:ring-danger-500/10" : "border-neutral-200 focus:border-primary-500"
                } rounded-xl text-sm focus:outline-none focus:ring-2`}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              {errors.description && <span className="text-xs text-danger-600 font-medium">{errors.description}</span>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Color"
                placeholder="e.g. Navy Blue"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              />
              <Input
                label="Brand"
                placeholder="e.g. Apple, Nike"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              />
              <Input
                label="Model"
                placeholder="e.g. Pro Max, A2442"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              />
            </div>

            <Input
              label="Identifying Features"
              placeholder="e.g. Small scratch on top left lid, sticker of a mountain"
              value={formData.identifyingFeatures}
              onChange={(e) => setFormData({ ...formData, identifyingFeatures: e.target.value })}
            />
          </div>
        )}

        {/* STEP 2: WHEN & WHERE */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-lg font-bold text-neutral-900 border-b border-neutral-50 pb-2">
              Step 2: When & Where
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={`Date ${type === "lost" ? "Lost" : "Found"} *`}
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                error={errors.date}
              />
              <Input
                label="Approximate Time (Optional)"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="City *"
                placeholder="e.g. Chennai, Bangalore"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                error={errors.city}
              />
              <Input
                label="Area / Neighborhood *"
                placeholder="e.g. Adyar, Anna Nagar, Campus Quad"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                error={errors.area}
              />
            </div>

            <Input
              label="Approximate Location (Public) *"
              placeholder="e.g. Near Science Block Library, 2nd floor bench"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              error={errors.location}
            />

            <div className="p-3 bg-neutral-50 border border-neutral-100 rounded-xl text-xs text-neutral-500 flex items-center gap-2">
              <Info className="h-4 w-4 text-neutral-400 shrink-0" />
              <span>We do not force exact GPS coordinates. Public listings show approximate area only.</span>
            </div>
          </div>
        )}

        {/* STEP 3: PHOTOS */}
        {currentStep === 3 && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-lg font-bold text-neutral-900 border-b border-neutral-50 pb-2">
              Step 3: Upload Photos
            </h3>

            <p className="text-xs text-neutral-500">
              Upload up to {MAX_IMAGE_COUNT} clear photos (JPEG, PNG, or WEBP, max 5MB per image).
            </p>

            {/* Dropzone */}
            {imageFiles.length < MAX_IMAGE_COUNT && (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-200 hover:border-primary-500 bg-neutral-50/50 hover:bg-primary-50/20 rounded-2xl p-6 cursor-pointer transition-colors">
                <Upload className="h-8 w-8 text-neutral-400 mb-2" />
                <span className="text-sm font-semibold text-neutral-700">Click to upload photos</span>
                <span className="text-xs text-neutral-400 mt-1">JPEG, PNG, WEBP up to 5MB</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </label>
            )}

            {imageError && (
              <p className="text-xs font-semibold text-danger-600 bg-danger-50 p-2.5 rounded-xl border border-danger-100">
                {imageError}
              </p>
            )}

            {/* Image Previews Grid */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {imagePreviews.map((src, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-neutral-200 group bg-neutral-100">
                    <img src={src} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                    {idx === 0 && (
                      <span className="absolute top-2 left-2 bg-primary-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                        Primary
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-2 right-2 p-1 bg-neutral-900/70 hover:bg-danger-600 text-white rounded-full transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 4: OPTIONAL INFO */}
        {currentStep === 4 && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-lg font-bold text-neutral-900 border-b border-neutral-50 pb-2">
              Step 4: Optional Information
            </h3>

            {type === "lost" && (
              <Input
                label="Optional Finder Reward (₹)"
                type="number"
                placeholder="e.g. 500"
                value={formData.reward}
                onChange={(e) => setFormData({ ...formData, reward: e.target.value })}
                leftIcon={<DollarSign className="h-5 w-5 text-neutral-400" />}
              />
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-neutral-700">Additional Notes</label>
              <textarea
                rows={3}
                placeholder="Any preferred contact hours or additional context..."
                className="w-full px-4 py-2.5 bg-white border border-neutral-200 focus:border-primary-500 rounded-xl text-sm focus:outline-none focus:ring-2"
                value={formData.additionalNotes}
                onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* STEP 5: REVIEW */}
        {currentStep === 5 && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-lg font-bold text-neutral-900 border-b border-neutral-50 pb-2">
              Step 5: Review Listing Preview
            </h3>

            <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-5 space-y-4">
              <div className="flex gap-4 items-start">
                <div className="h-20 w-20 rounded-xl bg-neutral-200 overflow-hidden shrink-0 border border-neutral-200 flex items-center justify-center">
                  {imagePreviews.length > 0 ? (
                    <img src={imagePreviews[0]} alt="Primary" className="w-full h-full object-cover" />
                  ) : (
                    <Laptop className="h-8 w-8 text-neutral-400" />
                  )}
                </div>
                <div className="space-y-1">
                  <span className="text-xs bg-primary-100 text-primary-700 font-bold px-2 py-0.5 rounded-md">
                    {type === "lost" ? "Lost Item" : "Found Item"}
                  </span>
                  <h4 className="text-lg font-bold text-neutral-900">{formData.title}</h4>
                  <p className="text-xs text-neutral-500">{formData.category} &bull; {formData.city}, {formData.area}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs border-t border-neutral-200/60 pt-3">
                <div><span className="text-neutral-400">Date:</span> <span className="font-semibold text-neutral-800">{formData.date}</span></div>
                <div><span className="text-neutral-400">Color:</span> <span className="font-semibold text-neutral-800">{formData.color || "N/A"}</span></div>
                <div><span className="text-neutral-400">Brand:</span> <span className="font-semibold text-neutral-800">{formData.brand || "N/A"}</span></div>
                <div><span className="text-neutral-400">Reward:</span> <span className="font-semibold text-neutral-800">{formData.reward ? `₹${formData.reward}` : "None"}</span></div>
              </div>

              <div className="text-xs text-neutral-600 border-t border-neutral-200/60 pt-2">
                <span className="font-bold text-neutral-800">Description: </span>
                {formData.description}
              </div>
            </div>
          </div>
        )}

        {/* STEP CONTROLS BUTTONS */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
          {currentStep > 1 ? (
            <Button type="button" variant="outline" onClick={handlePrevStep} className="gap-1">
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          ) : (
            <div></div>
          )}

          {currentStep < 5 ? (
            <Button type="button" variant="primary" onClick={handleNextStep} className="gap-1">
              Next Step
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" variant="primary" isLoading={isSubmitting} className="gap-2">
              Submit {type === "lost" ? "Lost" : "Found"} Item
            </Button>
          )}
        </div>

      </form>
    </div>
  );
};

export default MultiStepReportForm;
