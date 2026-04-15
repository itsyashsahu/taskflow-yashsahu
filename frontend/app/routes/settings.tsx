import { useState } from "react"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { Avatar, AvatarFallback } from "~/components/ui/avatar"
import { Separator } from "~/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"
import { useAuthStore } from "~/store/auth"
import { useTheme } from "~/components/theme-provider"
import { toast } from "sonner"
import { PageHeader } from "~/components/common"

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export default function Settings() {
  const { user } = useAuthStore()

  const [name, setName] = useState(user?.name || "")
  const [email, setEmail] = useState(user?.email || "")

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPasswords, setShowPasswords] = useState(false)

  const { theme, setTheme } = useTheme()

  const handleThemeChange = async (newTheme: "light" | "dark" | "system") => {
    try {
      await setTheme(newTheme)
      toast.success(`Theme changed to ${newTheme}`)
    } catch (error: any) {
      toast.error(error.message || "Failed to update theme")
    }
  }

  const handleProfileSave = () => {
    if (!name.trim()) {
      toast.error("Name is required")
      return
    }
    toast.success("Profile updated successfully!")
  }

  const handlePasswordChange = () => {
    if (!currentPassword) {
      toast.error("Current password is required")
      return
    }
    if (!newPassword) {
      toast.error("New password is required")
      return
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    toast.success("Password updated successfully!")
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
  }

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        title="Settings"
        description="Manage your profile, security, and appearance."
      />

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="sticky top-0 z-10 mb-6 flex h-auto w-full flex-wrap gap-2 bg-background p-1">
          <TabsTrigger value="profile" className="flex-1 sm:flex-none">
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="flex-1 sm:flex-none">
            Security
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex-1 sm:flex-none">
            Appearance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your account profile information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="size-16">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    {user ? getInitials(user.name) : "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed
                  </p>
                </div>

                <Button onClick={handleProfileSave}>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>
                Manage your password and account security
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showPasswords ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="********"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type={showPasswords ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 characters"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type={showPasswords ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="********"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="show-passwords"
                    checked={showPasswords}
                    onChange={(e) => setShowPasswords(e.target.checked)}
                    aria-label="Show passwords"
                    className="rounded border-input"
                  />
                  <Label htmlFor="show-passwords" className="text-sm font-normal">
                    Show passwords
                  </Label>
                </div>

                <Button onClick={handlePasswordChange}>Update Password</Button>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium text-destructive">Danger Zone</h3>
                <p className="text-sm text-muted-foreground">
                  Once you delete your account, there is no going back. Please
                  be certain.
                </p>
                <DeleteAccountButton />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize how TaskFlow looks on your device
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <button
                  onClick={() => handleThemeChange("light")}
                  className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
                    theme === "light"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-background shadow-sm">
                    <svg
                      className="size-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <circle cx="12" cy="12" r="5" />
                      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Light</span>
                </button>

                <button
                  onClick={() => handleThemeChange("dark")}
                  className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
                    theme === "dark"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-900 shadow-sm">
                    <svg
                      className="size-6 text-slate-50"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Dark</span>
                </button>

                <button
                  onClick={() => handleThemeChange("system")}
                  className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
                    theme === "system"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-background shadow-sm">
                    <svg
                      className="size-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <rect x="2" y="3" width="20" height="14" rx="2" />
                      <path d="M8 21h8M12 17v4" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">System</span>
                </button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function DeleteAccountButton() {
  const [open, setOpen] = useState(false)
  const [confirmEmail, setConfirmEmail] = useState("")

  const handleDelete = () => {
    if (confirmEmail !== useAuthStore.getState().user?.email) {
      toast.error("Email does not match")
      return
    }
    toast.error("Account deletion is disabled for safety")
    setOpen(false)
    setConfirmEmail("")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        Delete Account
      </Button>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Account</DialogTitle>
          <DialogDescription>
            This action is irreversible. To confirm, please enter your email
            address.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <Input
            type="email"
            placeholder="your@email.com"
            value={confirmEmail}
            onChange={(e) => setConfirmEmail(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete Forever
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}