describe('MainController: ', () => {
  let $rootScope;
  let $scope;
  let $controller;
  let $window;
  let utils;
  let firebaseService;
  let auth;
  let modalService;
  let voteService;

  beforeEach(() => {
    angular.mock.module('fireideaz');

    inject($injector => {
      $rootScope = $injector.get('$rootScope');
      $scope = $rootScope.$new();
      $controller = $injector.get('$controller');
      $window = $injector.get('$window');
      utils = $injector.get('Utils');
      modalService = $injector.get('ModalService');
      firebaseService = $injector.get('FirebaseService');
      auth = $injector.get('Auth');
      voteService = $injector.get('VoteService');

      $scope.userId = 'userId';
      $scope.board = { max_votes: 6 };

      sinon.stub(utils, 'getNextId').returns(3);

      $controller('MainController', {
        $scope,
        utils,
        modalService,
        firebaseService,
        auth,
        voteService,
        $window,
      });
    });
  });

  describe('Board', () => {
    it('should return multiple fields when sort board order by votes', () => {
      $scope.sortField = 'votes';

      expect($scope.getSortFields()[0]).to.equal('-votes');
      expect($scope.getSortFields()[1]).to.equal('date_created');
    });

    it('should return date_created when sort board order is not by votes', () => {
      $scope.sortField = 'something else';

      expect($scope.getSortFields()).to.equal('date_created');
    });

    it('should change the board context', () => {
      const updateSpy = sinon.spy();

      $scope.boardRef = {
        update: updateSpy,
      };

      $scope.changeBoardContext();

      expect(updateSpy.called).to.be.true;
    });

    it('should change the board name', () => {
      const updateSpy = sinon.spy();

      $scope.boardRef = {
        update: updateSpy,
      };

      $scope.changeBoardName();

      expect(updateSpy.called).to.be.true;
    });

    it('should toggle the private writing feature', () => {
      const updateSpy = sinon.spy();

      $scope.boardRef = {
        update: updateSpy,
      };

      $scope.updatePrivateWritingToggle(false);

      expect(updateSpy.calledWith({ text_editing_is_private: false })).to.be
        .true;
    });

    it('should create a new board', () => {
      sinon.stub(utils, 'createUserId').returns('userId');
      const createUserSpy = sinon.spy(auth, 'createUserAndLog');
      const closeAllSpy = sinon.spy(modalService, 'closeAll');

      $scope.createNewBoard();

      expect(createUserSpy.calledWith($scope.userId)).to.be.true;
      expect(closeAllSpy.called).to.be.true;
    });

    it('should create a new board with submitOnEnter fn', () => {
      sinon.stub(utils, 'createUserId').returns('userId');
      const createUserSpy = sinon.spy(auth, 'createUserAndLog');
      const closeAllSpy = sinon.spy(modalService, 'closeAll');

      $scope.newBoard.name = 'any_name_but_not_null';
      const event = {};
      event.keyCode = 13;
      $scope.submitOnEnter(event, 'createNewBoard');

      expect(createUserSpy.calledWith($scope.userId)).to.be.true;
      expect(closeAllSpy.called).to.be.true;
    });

    it('should add the query string to the location when the sort is changed', () => {
      $scope.sortField = 'votes';
      $scope.updateSortOrder();
      expect($window.location.search).to.equal('?sort=votes');
    });

    it('should only have one query string if the sort is changed multiple times', () => {
      $scope.sortField = 'votes';
      $scope.updateSortOrder();
      $scope.sortField = 'date_created';
      $scope.updateSortOrder();
      expect($window.location.search).to.equal('?sort=date_created');
    });
  });

  describe('Messages', () => {
    it('should delete a message', () => {
      const removeSpy = sinon.spy();
      const closeAllSpy = sinon.spy(modalService, 'closeAll');

      const message = {
        text: 'text of message',
        user_id: '139021',
      };

      $scope.messages = {
        $remove: removeSpy,
      };

      $scope.deleteMessage(message);

      expect(closeAllSpy.called).to.be.true;
      expect(removeSpy.calledWith(message)).to.be.true;
    });

    it('should add a new message', () => {
      sinon.stub(firebaseService, 'getServerTimestamp').returns('00:00:00');

      const addMessagePromise = { then: sinon.spy() };
      const addStub = sinon.stub().returns(addMessagePromise);

      $scope.messages = {
        $add: addStub,
      };

      $scope.addNewMessage({ id: 1 });

      expect(addStub.called).to.be.true;
    });
  });

  describe('Columns', () => {
    let setSpy;
    let boardColumns;
    let closeAllSpy;

    beforeEach(() => {
      closeAllSpy = sinon.spy(modalService, 'closeAll');

      setSpy = sinon.spy();

      boardColumns = {
        set: setSpy,
      };

      sinon.stub(utils, 'toObject').returns({ column: 'column' });

      $scope.board = {
        columns: [
          {
            value: 'columnName',
            id: 1,
          },
          {
            value: 'otherColumnName',
            id: 2,
          },
        ],
      };

      sinon.stub(firebaseService, 'getBoardColumns').returns(boardColumns);
    });

    it('should add a new column to the board', () => {
      const expectedColumns = [
        {
          value: 'columnName',
          id: 1,
        },
        {
          value: 'otherColumnName',
          id: 2,
        },
        {
          value: 'anotherColumnName',
          id: 3,
        },
      ];

      $scope.addNewColumn('anotherColumnName');

      expect($scope.board.columns).to.deep.equal(expectedColumns);
      expect(setSpy.called).to.be.true;
      expect(closeAllSpy.called).to.be.true;
    });

    it('should add a new column to the board with submitOnEnter fn', () => {
      const expectedColumns = [
        {
          value: 'columnName',
          id: 1,
        },
        {
          value: 'otherColumnName',
          id: 2,
        },
        {
          value: 'anotherColumnName',
          id: 3,
        },
      ];

      const event = {};
      event.keyCode = 13;
      $scope.submitOnEnter(event, 'addNewColumn', 'anotherColumnName');

      expect($scope.board.columns).to.deep.equal(expectedColumns);
      expect(setSpy.called).to.be.true;
      expect(closeAllSpy.called).to.be.true;
    });

    it('should not add a new column to the board when name is empty', () => {
      const expectedColumns = [
        {
          value: 'columnName',
          id: 1,
        },
        {
          value: 'otherColumnName',
          id: 2,
        },
      ];

      $scope.addNewColumn('');

      expect($scope.board.columns).to.deep.equal(expectedColumns);
      expect(setSpy.called).to.be.false;
      expect(closeAllSpy.called).to.be.false;
    });

    it('should not add a new column to the board when name is undefined', () => {
      const expectedColumns = [
        {
          value: 'columnName',
          id: 1,
        },
        {
          value: 'otherColumnName',
          id: 2,
        },
      ];

      $scope.addNewColumn(undefined);

      expect($scope.board.columns).to.deep.equal(expectedColumns);
      expect(setSpy.called).to.be.false;
      expect(closeAllSpy.called).to.be.false;
    });

    it('should change column name', () => {
      $scope.changeColumnName(1, 'new name!');

      expect($scope.board.columns[0].value).to.equal('new name!');
      expect(setSpy.called).to.be.true;
      expect(closeAllSpy.called).to.be.true;
    });

    it('should not change column name for empty string', () => {
      $scope.changeColumnName(1, '');

      expect($scope.board.columns[0].value).to.equal('columnName');
      expect(setSpy.called).to.be.false;
      expect(closeAllSpy.called).to.be.false;
    });

    it('should not change column name for undefined', () => {
      $scope.changeColumnName(1, undefined);

      expect($scope.board.columns[0].value).to.equal('columnName');
      expect(setSpy.called).to.be.false;
      expect(closeAllSpy.called).to.be.false;
    });

    it('should delete last column of the board', () => {
      const expectedBoard = {
        columns: [
          {
            value: 'columnName',
            id: 1,
          },
          {
            value: 'otherColumnName',
            id: 2,
          },
        ],
      };

      $scope.deleteColumn({ id: 3 });

      expect($scope.board.columns).to.deep.equal(expectedBoard.columns);
      expect(setSpy.called).to.be.true;
      expect(closeAllSpy.called).to.be.true;
    });

    it('should delete specific column of the board', () => {
      const expectedColumns = [
        {
          value: 'otherColumnName',
          id: 2,
        },
      ];

      $scope.deleteColumn({ id: 1 });

      expect($scope.board.columns).to.deep.equal(expectedColumns);
      expect(setSpy.called).to.be.true;
      expect(closeAllSpy.called).to.be.true;
    });
  });
});
