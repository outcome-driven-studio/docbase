"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"

import { LoginFormData } from "@/components/login-form"

export async function login(formData: LoginFormData) {
  const supabase = createClient()
  const { email, password } = formData
  const { error, data } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    const isAlreadyUser = await supabase.rpc("checkIfUser", {
      given_mail: email,
    })
    if (isAlreadyUser.data === false) {
      return {
        errorMessage:
          "No account exists for this email address. Please sign up for an account.",
      }
    } else {
      return { errorMessage: error.message }
    }
  }

  // Check if user has completed onboarding
  if (data.user) {
    const { data: userData } = await supabase
      .from("users")
      .select("onboarding_completed, name, title")
      .eq("id", data.user.id)
      .single()

    // If onboarding not completed AND profile is not filled, send to account page
    // Users with filled profiles (name or title) should go to /links
    if (userData && !userData.onboarding_completed && !userData.name && !userData.title) {
      revalidatePath("/", "layout")
      redirect("/account")
    }
  }

  revalidatePath("/", "layout")
  redirect("/links")
}
