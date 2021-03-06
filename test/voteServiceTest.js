describe('VoteService: ', () => {
  let FirebaseService;
  let VoteService;
  let updateStub;

  beforeEach(angular.mock.module('fireideaz'));
  beforeEach(inject((_VoteService_, _FirebaseService_) => {
    VoteService = _VoteService_;
    FirebaseService = _FirebaseService_;
    updateStub = sinon.stub();

    sinon.stub(localStorage, 'setItem');
    sinon.stub(localStorage, 'getItem');
    sinon.stub(VoteService, 'returnNumberOfVotes');
    sinon.stub(VoteService, 'returnNumberOfVotesOnMessage');
    sinon.stub(VoteService, 'remainingVotes');

    sinon.stub(FirebaseService, 'getServerTimestamp').returns('00:00:00');

    sinon.stub(FirebaseService, 'getMessageRef').returns({
      update: updateStub,
    });
    sinon.stub(FirebaseService, 'getBoardRef').returns({
      update: updateStub,
    });
  }));

  afterEach(() => {
    localStorage.getItem.restore();
    localStorage.setItem.restore();
    VoteService.returnNumberOfVotes.restore();
    VoteService.returnNumberOfVotesOnMessage.restore();
  });

  describe('returnNumberOfVotes', () => {
    it('should return number of votes', () => {
      localStorage.getItem.returns('{"abc":1, "abd":3, "sef":2}');
      expect(
        VoteService.returnNumberOfVotes('userId', ['abc', 'abd', 'sef'])
      ).to.equal(6);
    });

    it('should return number of votes of 3', () => {
      localStorage.getItem.returns('{"abc":3}');
      expect(VoteService.returnNumberOfVotes('userId', ['abc'])).to.equal(3);
    });

    it('should return number of votes of 5 when message was deleted', () => {
      localStorage.getItem.returns('{"abc":3, "avc": 2, "afe": 2}');
      expect(
        VoteService.returnNumberOfVotes('userId', ['abc', 'avc'])
      ).to.equal(5);
    });

    it('should return zero if there is no board', () => {
      localStorage.getItem.returns(null);
      expect(VoteService.returnNumberOfVotes('userId')).to.equal(0);
    });
  });

  describe('returnNumberOfVotesOnMessage', () => {
    it('should return array containing 1 element for each vote on a message', () => {
      VoteService.returnNumberOfVotesOnMessage.returns(3);

      const array = VoteService.getNumberOfVotesOnMessage('userId', 'abc');

      expect(array.length).to.equal(3);
    });

    it('should return empty array', () => {
      VoteService.returnNumberOfVotesOnMessage.returns(0);

      const array = VoteService.getNumberOfVotesOnMessage('userId', 'abc');

      expect(array.length).to.equal(0);
    });

    it('should return number of votes', () => {
      localStorage.getItem.returns('{"abc":1, "abd":3, "sef":2}');
      expect(
        VoteService.returnNumberOfVotesOnMessage('userId', 'abc')
      ).to.equal(1);
    });

    it('should return number of votes of 3', () => {
      localStorage.getItem.returns('{"abc":3}');
      expect(
        VoteService.returnNumberOfVotesOnMessage('userId', 'abc')
      ).to.equal(3);
    });

    it('should return zero if there is no board', () => {
      localStorage.getItem.returns(null);
      expect(
        VoteService.returnNumberOfVotesOnMessage('userId', 'abc')
      ).to.equal(0);
    });
  });

  describe('remainingVotes', () => {
    it('should return remaining votes 3', () => {
      VoteService.returnNumberOfVotes.returns(2);
      expect(VoteService.remainingVotes('userId', 5, [])).to.equal(3);
    });

    it('should return remaining votes 0', () => {
      VoteService.returnNumberOfVotes.returns(5);
      expect(VoteService.remainingVotes('userId', 5)).to.equal(0);
    });
  });

  describe('increase messages', () => {
    it('should set user message votes to 1', () => {
      localStorage.getItem.returns(null);

      VoteService.increaseMessageVotes('userId', 'abc');

      expect(localStorage.setItem.calledWith('userId', '{"abc":1}')).to.be.true;
    });

    it('should increase user message votes to 2', () => {
      localStorage.getItem.returns('{"abc":1}');

      VoteService.increaseMessageVotes('userId', 'abc');

      expect(localStorage.setItem.calledWith('userId', '{"abc":2}')).to.be.true;
    });

    it('should increase user message votes to 5', () => {
      localStorage.getItem.returns('{"abc":4,"abd":3}');

      VoteService.increaseMessageVotes('userId', 'abc');

      expect(localStorage.setItem.calledWith('userId', '{"abc":5,"abd":3}')).to
        .be.true;
    });
  });

  describe('decrease messages', () => {
    it('should remove from localStorage if votes equal to 1', () => {
      localStorage.getItem.returns('{"abc":1}');

      VoteService.decreaseMessageVotes('userId', 'abc');

      expect(localStorage.setItem.calledWith('userId', '{}')).to.be.true;
    });

    it('should remove from localStorage if votes equal to -1', () => {
      localStorage.getItem.returns('{"abc":-1}');

      VoteService.decreaseMessageVotes('userId', 'abc');

      expect(localStorage.setItem.calledWith('userId', '{}')).to.be.true;
    });

    it('should decrease votes', () => {
      localStorage.getItem.returns('{"abc":3}');

      VoteService.decreaseMessageVotes('userId', 'abc');

      expect(localStorage.setItem.calledWith('userId', '{"abc":2}')).to.be.true;
    });

    it('should decrease user message votes to 4', () => {
      localStorage.getItem.returns('{"abc":5,"abd":3}');

      VoteService.decreaseMessageVotes('userId', 'abc');

      expect(localStorage.setItem.calledWith('userId', '{"abc":4,"abd":3}')).to
        .be.true;
    });
  });

  describe('merge messages', () => {
    it('should merge messages votes', () => {
      localStorage.getItem.returns('{"abc":5,"abf":3,"abd":2}');

      VoteService.mergeMessages('userId', 'abc', 'abf');

      expect(localStorage.setItem.calledWith('userId', '{"abf":8,"abd":2}')).to
        .be.true;
    });

    it('should not merge messages votes if drag is zero', () => {
      localStorage.getItem.returns('{"abf":3,"abd":2}');

      VoteService.mergeMessages('userId', 'abc', 'abf');

      expect(localStorage.setItem.called).to.be.false;
    });

    it('should merge messages votes if drop is zero', () => {
      localStorage.getItem.returns('{"abc":3,"abd":2}');
      VoteService.mergeMessages('userId', 'abc', 'abf');

      expect(
        localStorage.setItem.calledWith(
          'userId',
          JSON.stringify({ abd: 2, abf: 3 })
        )
      ).to.be.true;
    });
  });

  describe('control votes', () => {
    it('should be able to unvote if votes equal to 3', () => {
      localStorage.getItem.returns('{"abc":2,"afe":1}');
      expect(VoteService.canUnvoteMessage('userId', 'abc')).to.be.true;
    });

    it('should not be able to unvote if votes equal to 0', () => {
      localStorage.getItem.returns(null);
      expect(VoteService.canUnvoteMessage('userId', 'abc')).to.be.false;
    });

    it('should return true if still has votes', () => {
      VoteService.remainingVotes.returns(2);
      expect(VoteService.isAbleToVote('abc', 5)).to.be.true;
    });

    it('should return false if does not have votes', () => {
      VoteService.remainingVotes.returns(0);
      expect(VoteService.isAbleToVote('abc', 5)).to.be.false;
    });
  });

  describe('extract message ids', () => {
    it('should extract messages ids', () => {
      const original = [{ $id: '123' }, { $id: '124' }, { $id: '125' }];

      expect(VoteService.extractMessageIds(original).length).to.equal(3);
      expect(VoteService.extractMessageIds(original)[0]).to.equal('123');
      expect(VoteService.extractMessageIds(original)[1]).to.equal('124');
      expect(VoteService.extractMessageIds(original)[2]).to.equal('125');
    });
  });

  describe('vote limits', () => {
    beforeEach(() => {
      sinon.stub(VoteService, 'isAbleToVote').returns(true);
      sinon.spy(VoteService, 'increaseMessageVotes');
      sinon.spy(VoteService, 'decreaseMessageVotes');
      sinon.stub(VoteService, 'canUnvoteMessage').returns(true);
    });
    it('is able to increment the maximum number of votes allowed per user', () => {
      VoteService.incrementMaxVotes(123, 1);
      expect(updateStub.calledWith({ max_votes: 2 })).to.be.true;
    });

    it('is not able to increment the maximum number of votes allowed per user if bigger than 99', () => {
      VoteService.incrementMaxVotes(123, 99);
      expect(updateStub.called).to.be.false;
    });

    it('is able to decrement the maximum number of votes allowed per user', () => {
      VoteService.decrementMaxVotes(123, 3);
      expect(updateStub.calledWith({ max_votes: 2 })).to.be.true;
    });
  });

  it('should vote on a message', () => {
    VoteService.vote('userId', 10, {}, 'abc', 5);

    expect(updateStub.calledWith({ votes: 6, date: '00:00:00' })).to.be.true;
    expect(VoteService.increaseMessageVotes.calledWith('userId', 'abc')).to.be
      .true;
  });

  it('should unvote a message', () => {
    VoteService.unvote('userId', 'abc', 5);

    expect(updateStub.calledWith({ votes: 4, date: '00:00:00' })).to.be.true;
    expect(VoteService.decreaseMessageVotes.calledWith('userId', 'abc')).to.be
      .true;
  });

  it('should not give negative votes to a message with votes -1', () => {
    VoteService.unvote('userId', 'abc', -1);

    expect(updateStub.calledWith({ votes: 0, date: '00:00:00' })).to.be.true;
    expect(VoteService.decreaseMessageVotes.calledWith('userId', 'abc')).to.be
      .true;
  });

  it('should not give negative votes to a message with zero votes', () => {
    VoteService.unvote('userId', 'abc', 0);

    expect(updateStub.calledWith({ votes: 0, date: '00:00:00' })).to.be.true;
    expect(VoteService.decreaseMessageVotes.calledWith('userId', 'abc')).to.be
      .true;
  });
});
