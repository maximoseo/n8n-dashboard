export function sendTelegramAlert(message, botToken, chatId) {
  if (!botToken || !chatId) return Promise.resolve(false);
  
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML'
    })
  }).then(r => r.ok).catch(() => false);
}

export function formatAlertMessage(anomalies, stats) {
  let msg = '🚨 <b>n8n Dashboard Alert</b>\n\n';
  
  if (anomalies.length > 0) {
    msg += `<b>⚠️ Anomalies (${anomalies.length}):</b>\n`;
    anomalies.slice(0, 5).forEach(a => {
      const icon = a.severity === 'critical' ? '🔴' : a.severity === 'warning' ? '🟡' : '🔵';
      msg += `${icon} ${a.workflow.name}: ${a.message}\n`;
    });
    msg += '\n';
  }
  
  msg += `<b>📊 Stats:</b>\n`;
  msg += `• Workflows: ${stats.totalWorkflows} (${stats.activeWorkflows} active)\n`;
  msg += `• Executions: ${stats.recentExecutions}\n`;
  msg += `• Success: ${stats.successfulExecutions} | Failed: ${stats.failedExecutions}\n`;
  msg += `• Success Rate: ${stats.recentExecutions > 0 ? Math.round(stats.successfulExecutions / stats.recentExecutions * 100) : 0}%\n`;
  
  return msg;
}
