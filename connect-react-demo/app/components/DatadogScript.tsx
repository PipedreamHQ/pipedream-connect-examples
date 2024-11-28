import Script from "next/script"
import { env as e } from "@/lib/env"

const env = process.env.NODE_ENV === "production" ? "production" : "development"
const version = e.NEXT_PUBLIC_GIT_COMMIT_SHA

const rumInit = {
  clientToken: e.DD_CLIENT_TOKEN,
  site: 'datadoghq.com',
  env,
  service: e.DD_SERVICE,
  version,
  sessionSampleRate: 100,
  applicationId: e.DD_APPLICATION_ID,
  sessionReplaySampleRate: 100,
  trackUserInteractions: true,
  trackResources: true,
  trackLongTasks: true,
}

const logsInit = {
  clientToken: e.DD_CLIENT_TOKEN,
  site: 'datadoghq.com',
  env,
  service: e.DD_SERVICE,
  version,
  sessionSampleRate: 100,
  forwardErrorsToLogs: true,
  forwardConsoleLogs: 'all'
}

const script = `(function(h,o,u,n,d) {
  h=h[d]=h[d]||{q:[],onReady:function(c){h.q.push(c)}}
  d=o.createElement(u);d.async=1;d.src=n
  n=o.getElementsByTagName(u)[0];n.parentNode.insertBefore(d,n)
})(window,document,'script','https://www.datadoghq-browser-agent.com/us1/v5/datadog-rum.js','DD_RUM')
window.DD_RUM.onReady(function() {
  window.DD_RUM.init(${JSON.stringify(rumInit)});
});
(function(h,o,u,n,d) {
    h=h[d]=h[d]||{q:[],onReady:function(c){h.q.push(c)}}
    d=o.createElement(u);d.async=1;d.src=n
    n=o.getElementsByTagName(u)[0];n.parentNode.insertBefore(d,n)
  })(window,document,'script','https://www.datadoghq-browser-agent.com/us1/v5/datadog-logs.js','DD_LOGS')
window.DD_LOGS.onReady(function() {
  window.DD_LOGS.init(${JSON.stringify(logsInit)})
})`

export function DatadogScript() {
  if (!e.DD_CLIENT_TOKEN) {
    return null
  }

  return <Script id="datadog-rum">{script}</Script>
}
