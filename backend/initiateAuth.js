const config = require('./config.json');

async function initiateAuth(req, res) {
  const options = {
    requestType: "code",
    redirectUri: "http://localhost:4000/oauth/callback",
    clientId: config.clientId,
    scopes: [
      "calendars.write",
      "calendars/events.write",
      "calendars/groups.write",
      "calendars/resources.write",
      "conversations.write",
      "contacts.write",
      "conversations/message.write",
      "opportunities.write",
      "workflows.readonly"
    ]
  };

  return res.redirect(
    `${config.baseUrl}/oauth/chooseLocation?response_type=${options.requestType}` +
    `&redirect_uri=${encodeURIComponent(options.redirectUri)}` +
    `&client_id=${options.clientId}` +
    `&scope=${encodeURIComponent(options.scopes.join(' '))}`
  );
}

module.exports = initiateAuth; 