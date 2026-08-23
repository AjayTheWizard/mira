"use client";

import { useEffect, useState } from "react";
import {
  createBranch,
  updateSalon,
  getSalon,
  getBranches,
  getBranchRatings,
} from "@/app/actions/manager";
import { PlusIcon, StoreIcon, Loader2, Star } from "lucide-react";
import {
  BranchAddressAutocomplete,
  PlaceResult,
} from "@/components/branch-address-autocomplete";
type SalonRow = {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  logoUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
} | null;

type BranchRow = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  isActive: boolean;
};

type BranchRatingRow = {
  branchId: string;
  branchName: string | null;
  average: number;
  count: number;
};

type BranchForm = {
  name: string;
  location: PlaceResult | null;
};

const emptySalon = {
  name: "AuraSync Salon",
  description: "",
  phone: "",
  email: "",
};

const emptyBranch: BranchForm = {
  name: "",
  location: null,
};

export function SalonView() {
  const [form, setForm] = useState(emptySalon);
  const [branches, setBranches] = useState<BranchRow[]>([]);
  const [branchRatings, setBranchRatings] = useState<BranchRatingRow[]>([]);
  const [salonImage, setSalonImage] = useState<string>("");
  const [branchForm, setBranchForm] = useState<BranchForm>(emptyBranch);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [addingBranch, setAddingBranch] = useState(false);

  async function refresh() {
    setLoading(true);
    setError(null);

    try {
      const [salonRow, branchRows, branchRatingRows] = await Promise.all([
        getSalon(),
        getBranches(),
        getBranchRatings(),
      ]);

      setForm({
        name: salonRow?.name ?? emptySalon.name,
        description: salonRow?.description ?? "",
        phone: salonRow?.phone ?? "",
        email: salonRow?.email ?? "",
      });

      setSalonImage(salonRow?.logoUrl ?? "");
      setBranches(branchRows as BranchRow[]);
      setBranchRatings(branchRatingRows as BranchRatingRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load salon");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function saveSalon(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setSaving(true);
    setError(null);

    try {
      await updateSalon({
        name: form.name,
        description: form.description,
        phone: form.phone,
        email: form.email,
      });

      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save salon");
    } finally {
      setSaving(false);
    }
  }

  async function addBranch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!branchForm.location) {
      setError("Please select a branch location from the suggestions.");
      return;
    }

    setAddingBranch(true);
    setError(null);

    try {
      await createBranch({
        name: branchForm.name,
        address: branchForm.location.address,
        city: branchForm.location.city,
        latitude: branchForm.location.latitude,
        longitude: branchForm.location.longitude,
        placeId: branchForm.location.placeId,
      });

      setBranchForm(emptyBranch);

      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add branch");
    } finally {
      setAddingBranch(false);
    }
  }

  return (
    <>
      <div className="manager-view-toolbar">
        <div>
          <p className="eyebrow">MY SALONS</p>
          <h2>One brand, every branch</h2>
          <p className="muted">
            Customize your salon identity and manage locations.
          </p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="manager-dashboard-grid">
        {/* SALON IDENTITY */}
        <section className="profile-panel">
          <p className="eyebrow">SALON IDENTITY</p>

          <h2>{form.name || "AuraSync Salon"}</h2>

          <div className="salon-image-manager">
            {salonImage ? (
              <img src={salonImage} alt="Salon cover" />
            ) : (
              <div className="salon-image-empty">
                <span>m</span>
                <p>Add a cover image to make your salon feel discoverable.</p>
              </div>
            )}

            <label className="upload-button">
              {salonImage ? "Replace cover image" : "Upload cover image"}

              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];

                  if (file) {
                    setSalonImage(URL.createObjectURL(file));
                  }
                }}
              />
            </label>
          </div>

          {loading ? (
            <div className="empty-state">Loading salon…</div>
          ) : (
            <form onSubmit={saveSalon}>
              <label>
                Salon name
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                />
              </label>

              <label>
                Description
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      description: e.target.value,
                    })
                  }
                />
              </label>

              <div className="two-col">
                <label>
                  Phone
                  <input
                    value={form.phone}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        phone: e.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Email
                  <input
                    value={form.email}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        email: e.target.value,
                      })
                    }
                  />
                </label>
              </div>

              <button className="btn btn-primary" disabled={saving}>
                {saving ? <Loader2 size={14} className="spin" /> : null}
                Save identity
              </button>
            </form>
          )}
        </section>

        {/* BRANCHES */}
        <section className="profile-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">BRANCHES</p>

              <h2>{branches.length} locations</h2>
            </div>

            <StoreIcon size={20} className="mini-icon" />
          </div>

          {loading ? (
            <div className="empty-state">Loading branches…</div>
          ) : (
            branches.map((b) => {
              const r = branchRatings.find((x) => x.branchId === b.id);
              return (
                <div className="branch-row" key={b.id}>
                  <div>
                    <strong>{b.name}</strong>

                    <p className="muted">
                      {b.address || "Branch location"} ·{" "}
                      {b.city || "Unknown city"}
                    </p>
                    <p className="muted">
                      {r ? (
                        <>
                          <Star size={12} fill="currentColor" /> {r.average.toFixed(1)} ·{" "}
                          {r.count} rating{r.count === 1 ? "" : "s"}
                        </>
                      ) : (
                        "No ratings yet"
                      )}
                    </p>
                  </div>

                  <span className="status-badge">
                    {b.isActive ? "Open" : "Closed"}
                  </span>
                </div>
              );
            })
          )}

          <form className="branch-form" onSubmit={addBranch}>
            <input
              value={branchForm.name}
              onChange={(e) =>
                setBranchForm({
                  ...branchForm,
                  name: e.target.value,
                })
              }
              placeholder="New branch name"
              required
            />

            <BranchAddressAutocomplete
              value={branchForm.location?.address ?? ""}
              onChange={(newAddress) => {
                setBranchForm((prev) => ({
                  ...prev,
                  location: {
                    // Keep existing location fields or default to empty values
                    address: newAddress,
                    city: prev.location?.city ?? "",
                    latitude: prev.location?.latitude ?? "",
                    longitude: prev.location?.longitude ?? "",
                    placeId: prev.location?.placeId ?? "",
                  },
                }));
              }}
              onSelect={(place) => {
                setBranchForm((prev) => ({
                  ...prev,
                  location: place, // Overwrite the entire object on selection
                }));
              }}
            />
            {branchForm.location?.city && (
              <p className="muted">City: {branchForm.location.city}</p>
            )}

            <button
              type="submit"
              className="btn btn-secondary"
              disabled={addingBranch}
            >
              {addingBranch ? (
                <Loader2 size={14} className="spin" />
              ) : (
                <PlusIcon size={14} />
              )}
              Add branch
            </button>
          </form>
        </section>
      </div>
    </>
  );
}
