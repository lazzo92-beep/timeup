/**
 * TimeUp - Trello Service
 * Wrapper for Trello Power-Up API calls
 */

/**
 * Gets the current card info.
 * @param {Object} t - Trello client
 * @returns {Promise<Object|null>} Card data or null
 */
export const getCard = async (t) => {
  try {
    return await t.card("id", "name", "url");
  } catch (error) {
    return null;
  }
};

/**
 * Gets the current board info.
 * @param {Object} t - Trello client
 * @returns {Promise<Object|null>} Board data or null
 */
export const getBoard = async (t) => {
  try {
    return await t.board("id", "name", "url");
  } catch (error) {
    return null;
  }
};

/**
 * Gets the current member info.
 * @param {Object} t - Trello client
 * @returns {Promise<Object|null>} Member data or null
 */
export const getMember = async (t) => {
  try {
    return await t.member("id", "fullName", "username", "avatar");
  } catch (error) {
    return null;
  }
};

/**
 * Gets all members of the current board.
 * @param {Object} t - Trello client
 * @returns {Promise<Array>} Array of board members or empty array
 */
export const getBoardMembers = async (t) => {
  try {
    const board = await t.board("members");
    return board?.members || [];
  } catch (error) {
    return [];
  }
};

/**
 * Closes the current popup.
 * @param {Object} t - Trello client
 * @returns {Promise<void>}
 */
export const closePopup = async (t) => {
  try {
    await t.closePopup();
  } catch (error) {
    // Silent failure
  }
};

const TrelloService = {
  getCard,
  getBoard,
  getMember,
  getBoardMembers,
  closePopup,
};
export default TrelloService;
