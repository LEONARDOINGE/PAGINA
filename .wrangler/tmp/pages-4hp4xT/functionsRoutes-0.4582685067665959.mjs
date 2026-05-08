import { onRequest as __api_health_js_onRequest } from "C:\\Users\\lm752\\OneDrive\\Documentos\\Visual Studio 2017\\PAGINA\\functions\\api\\health.js"
import { onRequest as __api_login_js_onRequest } from "C:\\Users\\lm752\\OneDrive\\Documentos\\Visual Studio 2017\\PAGINA\\functions\\api\\login.js"
import { onRequest as __api_register_js_onRequest } from "C:\\Users\\lm752\\OneDrive\\Documentos\\Visual Studio 2017\\PAGINA\\functions\\api\\register.js"
import { onRequest as __api_test_env_js_onRequest } from "C:\\Users\\lm752\\OneDrive\\Documentos\\Visual Studio 2017\\PAGINA\\functions\\api\\test-env.js"
import { onRequest as __api_verificar_admin_js_onRequest } from "C:\\Users\\lm752\\OneDrive\\Documentos\\Visual Studio 2017\\PAGINA\\functions\\api\\verificar-admin.js"
import { onRequest as __enviar_reserva_js_onRequest } from "C:\\Users\\lm752\\OneDrive\\Documentos\\Visual Studio 2017\\PAGINA\\functions\\enviar-reserva.js"

export const routes = [
    {
      routePath: "/api/health",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_health_js_onRequest],
    },
  {
      routePath: "/api/login",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_login_js_onRequest],
    },
  {
      routePath: "/api/register",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_register_js_onRequest],
    },
  {
      routePath: "/api/test-env",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_test_env_js_onRequest],
    },
  {
      routePath: "/api/verificar-admin",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_verificar_admin_js_onRequest],
    },
  {
      routePath: "/enviar-reserva",
      mountPath: "/",
      method: "",
      middlewares: [],
      modules: [__enviar_reserva_js_onRequest],
    },
  ]