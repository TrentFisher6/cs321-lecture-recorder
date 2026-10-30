import AppTabs from "@/components/app-tabs";

// Layout for the signed-in part of the app.
//
// Best practices:
// - "(app)" is a route group: the parentheses keep it out of the URL, so
//   (app)/reminders.tsx is the route "/reminders".
// - Keep layouts thin. They only choose the navigator. Screens own their data and UI.
// - Do not check auth here. The root layout's Stack.Protected guard already hides
//   this whole group when there is no session.
// - The tab bar lives in components/app-tabs.tsx (native) and app-tabs.web.tsx (web).
//   Metro picks the right file by platform extension, so add a new tab to both.
// - Every file in this folder becomes a tab. Declare each one as a Trigger in
//   app-tabs.tsx, using `hidden` for tabs a role should not see.
export default function TabLayout() {
    return <AppTabs />
}
