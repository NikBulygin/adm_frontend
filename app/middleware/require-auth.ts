export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthSession()

  await auth.init()

  if (!auth.isAuthenticated.value) {
    return navigateTo({
      path: '/login',
      query: {
        redirect: to.fullPath
      }
    })
  }
})
