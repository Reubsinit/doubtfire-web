angular.module("doubtfire.tasks.task-comments-viewer", [])

#
# View's the comments for a specific task, and allows new
# comments to be made on a task
#
.directive('taskCommentsViewer', ->
  restrict: 'E'
  templateUrl: 'tasks/task-comments-viewer/task-comments-viewer.tpl.html'
  scope:
    task: '='
    singleDropZone: '=?'
    comment: '=?'
    autofocus: '@?'
    refocusOnTaskChange: '@?'

  controller: ($scope, $modal, $state, $sce, $timeout, markdown, CommentResourceService, CommentsModal, listenerService, currentUser, TaskComment, taskService, alertService, analyticsService, Task) ->
    listeners = listenerService.listenTo($scope)
    markdown.setFlavor('github')

    $scope.uploadFiles = (files) ->
      if typeof files != "undefined"
        for file in files then do (file) ->
          $scope.postAttachmentComment(file)
        $scope.task.comments = taskService.mapComments($scope.task.comments)

    # Upload image files as comments to a given task
    $scope.postAttachmentComment = (file) ->
      taskService.addMediaComment(CommentResourceService.task, file,
        (success) ->
          taskService.scrollDown()
        (failure) ->
          alertService.add('danger', "Failed to post image. #{failure.data?.error}")
      )

    # Initialise scope comment text
    unless _.isString $scope.comment?.text
      $scope.comment = { text: "" }


    # Watch for initial task
    listeners.push $scope.$watch 'task', (newTask) ->
      return unless newTask?.project? # Must have project for task to be mapped
      $scope.project = newTask.project()
      # Once project is loaded fetch task comments
      TaskComment.query {
        project_id: $scope.project.project_id,
        task_definition_id: $scope.task.task_definition_id
      }, (response) ->
        comments = taskService.mapComments(response)
        $scope.task.comments = comments #in the HTML, the mapped task.comments are displayed
        $scope.lastComment = $scope.task.comments.slice(-1)[0]
        $scope.task.num_new_comments = 0
        taskService.scrollDown()
        $scope.focus?() if $scope.refocusOnTaskChange

        CommentResourceService.setTask($scope.task)


    $scope.openCommentsModal = (comment)->
      resourceUrl = $sce.trustAsResourceUrl(Task.generateCommentsAttachmentUrl($scope.project, $scope.task, comment))
      CommentResourceService.setResourceUrl(resourceUrl)
      CommentResourceService.setCommentType(comment.type)
      CommentsModal.show()

    $scope.canUserEdit = (comment) ->
      # TODO: This should not use global role, if admin is a student they can delete comments.
      return comment.author_is_me || currentUser.role == "Admin"

    $scope.isBubbleType = (comment) ->
      return taskService.isBubbleComment(comment.type)

    $scope.shouldShowAuthorIcon = (commentType) ->
      return not (commentType == "extension" || commentType == "status")

    $scope.getCommentAttachment = (comment) ->
      # TODO: Refactor to use other Task method
      mediaURL = $sce.trustAsResourceUrl(Task.generateCommentsAttachmentUrl($scope.project, $scope.task, comment))

    $overlay = angular.element(document.querySelector('#contextOverlay'))

    $scope.deleteComment = (id) ->
      TaskComment.delete { project_id: $scope.project.project_id, task_definition_id: $scope.task.task_definition_id, id: id },
        (response) ->
          comments = $scope.task.comments.filter (e) -> e.id isnt id
          comments = taskService.mapComments(comments)
          $scope.task.comments = comments
          analyticsService.event "View Task Comments", "Deleted existing comment"
        (response) ->
          alertService.add("danger", response.data.error, 2000)
)