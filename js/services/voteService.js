angular.module('fireideaz').service('VoteService', [
  'FirebaseService',
  firebaseService => {
    const voteService = {};

    voteService.getNumberOfVotesOnMessage = (userId, messageId) =>
      new Array(this.returnNumberOfVotesOnMessage(userId, messageId));

    voteService.returnNumberOfVotesOnMessage = (userId, messageKey) => {
      const userVotes = localStorage.getItem(userId)
        ? JSON.parse(localStorage.getItem(userId))
        : {};

      return userVotes[messageKey] ? userVotes[messageKey] : 0;
    };

    voteService.returnNumberOfVotes = (userId, messagesIds) => {
      const userVotes = localStorage.getItem(userId)
        ? JSON.parse(localStorage.getItem(userId))
        : {};

      const totalVotes = Object.keys(userVotes)
        .map(
          messageKey =>
            messagesIds.indexOf(messageKey) >= 0 ? userVotes[messageKey] : 0
        )
        .reduce((a, b) => a + b, 0);

      return localStorage.getItem(userId) ? totalVotes : 0;
    };

    voteService.extractMessageIds = messages =>
      messages ? messages.map(message => message.$id) : [];

    voteService.remainingVotes = (userId, maxVotes, messages) => {
      const messagesIds = voteService.extractMessageIds(messages);

      return maxVotes - voteService.returnNumberOfVotes(userId, messagesIds) > 0
        ? maxVotes - voteService.returnNumberOfVotes(userId, messagesIds)
        : 0;
    };

    voteService.increaseMessageVotes = (userId, messageKey) => {
      if (localStorage.getItem(userId)) {
        const boardVotes = JSON.parse(localStorage.getItem(userId));

        if (boardVotes[messageKey]) {
          boardVotes[messageKey] = parseInt(boardVotes[messageKey] + 1, 0);
          localStorage.setItem(userId, JSON.stringify(boardVotes));
        } else {
          boardVotes[messageKey] = 1;
          localStorage.setItem(userId, JSON.stringify(boardVotes));
        }
      } else {
        const newObject = {};
        newObject[messageKey] = 1;
        localStorage.setItem(userId, JSON.stringify(newObject));
      }
    };

    voteService.decreaseMessageVotes = (userId, messageKey) => {
      if (localStorage.getItem(userId)) {
        const boardVotes = JSON.parse(localStorage.getItem(userId));

        if (boardVotes[messageKey] <= 1) {
          delete boardVotes[messageKey];
        } else {
          boardVotes[messageKey] -= 1;
        }

        localStorage.setItem(userId, JSON.stringify(boardVotes));
      }
    };

    voteService.mergeMessages = (userId, dragMessage, dropMessage) => {
      const dragMessageVoteCount = voteService.returnNumberOfVotesOnMessage(
        userId,
        dragMessage
      );
      const dropMessageVoteCount = voteService.returnNumberOfVotesOnMessage(
        userId,
        dropMessage
      );
      const boardVotes = JSON.parse(localStorage.getItem(userId));

      if (dragMessageVoteCount > 0) {
        boardVotes[dropMessage] = dragMessageVoteCount + dropMessageVoteCount;
        delete boardVotes[dragMessage];

        localStorage.setItem(userId, JSON.stringify(boardVotes));
      }
    };

    voteService.canUnvoteMessage = (userId, messageKey) =>
      !!(
        localStorage.getItem(userId) &&
        JSON.parse(localStorage.getItem(userId))[messageKey]
      );

    voteService.isAbleToVote = (userId, maxVotes, messages) =>
      voteService.remainingVotes(userId, maxVotes, messages) > 0;

    voteService.incrementMaxVotes = (userId, maxVotes) => {
      const boardRef = firebaseService.getBoardRef(userId);

      if (maxVotes < 99) {
        boardRef.update({
          max_votes: maxVotes + 1,
        });
      }
    };

    voteService.decrementMaxVotes = (userId, maxVotes) => {
      const boardRef = firebaseService.getBoardRef(userId);

      boardRef.update({
        max_votes: Math.min(Math.max(maxVotes - 1, 1), 100),
      });
    };

    voteService.vote = (userId, maxVotes, messages, messageKey, votes) => {
      if (voteService.isAbleToVote(userId, maxVotes, messages)) {
        const messagesRef = firebaseService.getMessagesRef(userId);

        messagesRef.child(messageKey).update({
          votes: votes + 1,
          date: firebaseService.getServerTimestamp(),
        });

        this.increaseMessageVotes(userId, messageKey);
      }
    };

    voteService.unvote = (userId, messageKey, votes) => {
      if (voteService.canUnvoteMessage(userId, messageKey)) {
        const messagesRef = firebaseService.getMessagesRef(userId);
        const newVotes = votes >= 1 ? votes - 1 : 0;

        messagesRef.child(messageKey).update({
          votes: newVotes,
          date: firebaseService.getServerTimestamp(),
        });

        voteService.decreaseMessageVotes(userId, messageKey);
      }
    };

    voteService.hideVote = (userId, hideVote) => {
      const boardRef = firebaseService.getBoardRef(userId);
      boardRef.update({
        hide_vote: hideVote,
      });
    };

    return voteService;
  },
]);
