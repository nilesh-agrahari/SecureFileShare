from django.urls import path
from .views import FileUploadView, DocumentListView, ViewDocument, DownloadDocument, DeleteDocument, GenerateDownloadLink, SecureDownloadView

urlpatterns = [
    path('upload-file/', FileUploadView.as_view(), name='upload-file'),
    path('get-documents/', DocumentListView.as_view(), name='get-documents'),
    path('view-documents/<int:id>', ViewDocument.as_view(), name='view-document'),
    path('download-documents/<int:id>', DownloadDocument.as_view(), name='download-document'),
    path('delete-document/<int:id>', DeleteDocument.as_view(), name='delete-document'),
    path('generate-link/<int:id>/', GenerateDownloadLink.as_view(), name='generate-download-link'),
    path('secure-download/<str:signed_id>/', SecureDownloadView.as_view(), name='secure-download'),
]
