const { detectIntent } = require("./intentAgent");
const { rankMenuItems } = require("./menuRetrievalAgent");
const { evaluateSafety } = require("./safetyAgent");
const { synthesizeReply } = require("./responseAgent");

const runWaiterConversation = async ({
  restaurant,
  menuItems,
  message,
  mode,
  recentMessages,
}) => {
  const intent = detectIntent({ message, mode, menuItems });
  const retrieval = rankMenuItems({ menuItems, intent, message });
  const safety = evaluateSafety({
    menuItems,
    shortlisted: retrieval.shortlisted,
    intent,
  });

  return synthesizeReply({
    restaurant,
    menuItems,
    message,
    recentMessages,
    intent,
    shortlisted: retrieval.shortlisted,
    safety,
  });
};

module.exports = {
  runWaiterConversation,
};
