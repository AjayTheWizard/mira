import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  doublePrecision,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  role: text("role").notNull().default("customer"),
});
export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId").notNull(),
});
export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId").notNull(),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});
export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});
export const salon = pgTable("salon", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  phone: text("phone"),
  email: text("email"),
  logoUrl: text("logoUrl"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});
export const branch = pgTable("branch", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  salonId: text("salonId").notNull(),

  name: text("name").notNull(),

  address: text("address"),
  city: text("city"),
  phone: text("phone"),

  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  placeId: text("placeId"),

  isActive: boolean("isActive").notNull().default(true),

  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const payment = pgTable("payment", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  branchId: text("branchId"),
  appointmentId: text("appointmentId"),
  customerName: text("customerName").notNull(),
  serviceName: text("serviceName").notNull(),
  amount: integer("amount").notNull(),
  status: text("status").notNull().default("pending"),
  method: text("method"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});
export const rating = pgTable("rating", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  salonId: text("salonId").notNull(),
  branchId: text("branchId"),
  staffId: text("staffId"),
  appointmentId: text("appointmentId"),
  customerName: text("customerName").notNull(),
  score: integer("score").notNull(),
  comment: text("comment"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});
export const appointment = pgTable("appointment", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  customerId: text("customerId").notNull(),
  salonId: text("salonId").notNull(),
  branchId: text("branchId"),
  serviceId: text("serviceId"),
  staffId: text("staffId"),
  customerName: text("customerName").notNull(),
  serviceName: text("serviceName").notNull(),
  salonName: text("salonName").notNull(),
  appointmentDate: timestamp("appointmentDate").notNull(),
  durationMinutes: integer("durationMinutes").notNull().default(60),
  amount: integer("amount").notNull().default(0),
  status: text("status").notNull().default("upcoming"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});
export const service = pgTable("service", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  salonId: text("salonId").notNull(),
  name: text("name").notNull(),
  category: text("category"),
  description: text("description"),
  durationMinutes: integer("durationMinutes").notNull().default(60),
  price: integer("price").notNull().default(0),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});
export const staff = pgTable("staff", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  salonId: text("salonId").notNull(),
  branchId: text("branchId"),
  name: text("name").notNull(),
  role: text("role"),
  email: text("email"),
  phone: text("phone"),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});
export const favorite = pgTable("favorite", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  salonId: text("salonId").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});
export const preference = pgTable("preference", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull().unique(),
  location: text("location"),
  notificationsEnabled: boolean("notificationsEnabled").notNull().default(true),
  paymentRemindersEnabled: boolean("paymentRemindersEnabled")
    .notNull()
    .default(true),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});
export const notification = pgTable("notification", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  isRead: boolean("isRead").notNull().default(false),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});
export const availability = pgTable("availability", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  staffId: text("staffId").notNull(),
  dayOfWeek: integer("dayOfWeek").notNull(),
  startTime: text("startTime").notNull(),
  endTime: text("endTime").notNull(),
  isAvailable: boolean("isAvailable").notNull().default(true),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});
