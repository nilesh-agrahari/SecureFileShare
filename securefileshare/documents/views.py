from rest_framework.permissions import IsAuthenticated

from django.shortcuts import render
from django.http import FileResponse, Http404, HttpResponseForbidden
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.core.signing import BadSignature, SignatureExpired,TimestampSigner
from .models import Document
from django.urls import reverse



class FileUploadView(APIView):
    # permission_classes = [IsAuthenticated]

    def post(self, request):
        # user = request.user
        # if user.role != 'OPS_USER':
        #     return Response({'message': 'Only Operation users can upload files.'}, status=status.HTTP_403_FORBIDDEN)

        uploaded_file = request.FILES.get('file')

        if not uploaded_file:
            return Response({'message': 'No file provided.'}, status=status.HTTP_400_BAD_REQUEST)

        allowed_extensions = ['pptx', 'docx', 'xlsx']
        extension = uploaded_file.name.split('.')[-1]

        if extension not in allowed_extensions:
            return Response({'message': 'Invalid file type. Allowed: pptx, docx, xlsx.'}, status=status.HTTP_400_BAD_REQUEST)

        Document.objects.create(file=uploaded_file)
        return Response({'message': 'File uploaded successfully.'}, status=status.HTTP_201_CREATED)


class DocumentListView(APIView):
    def get(self, request):
        documents = Document.objects.all().order_by('-uploaded_at')

        doc_list = [
            {
                'id': doc.id,
                'file': doc.file.url,  # returns full media URL path
                'file_name': doc.file.name.split('/')[-1],
                'uploaded_at': doc.uploaded_at.strftime('%Y-%m-%d %H:%M:%S'),
            }
            for doc in documents
        ]

        return Response(doc_list, status=status.HTTP_200_OK)
    

signer = TimestampSigner() # Don't forget to declare this

class GenerateDownloadLink(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, id):
        user = request.user
        if user.role != 'CLIENT_USER':
            return Response({'message': 'Only Client Users can download documents.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            document = Document.objects.get(id=id)
            signed_value = signer.sign(str(document.id))
            download_url = request.build_absolute_uri(
                reverse('secure-download', kwargs={'signed_id': signed_value})
            )
            return Response({'download_url': download_url})
        except Document.DoesNotExist:
            return Response({'message': 'Document not found.'}, status=status.HTTP_404_NOT_FOUND)


class SecureDownloadView(APIView):
    # permission_classes = [IsAuthenticated]

    def get(self, request, signed_id):
        try:
            original_id = signer.unsign(signed_id, max_age=300)  # 5 minutes validity
            document = Document.objects.get(id=original_id)
            return FileResponse(document.file.open('rb'), filename=document.file.name)
        except (BadSignature, SignatureExpired):
            return Response({'message': 'Invalid or expired link.'}, status=403)
        except Document.DoesNotExist:
            return Response({'message': 'Document not found.'}, status=404)




class DownloadDocument(APIView):
    # permission_classes = [IsAuthenticated]  # optional since you're skipping auth

    def get(self, request, id):
        try:
            document = Document.objects.get(id=id)
            response = FileResponse(document.file.open('rb'), filename=document.file.name)
            return response
        except Document.DoesNotExist:
            return Response({'message': 'Document not found.'}, status=status.HTTP_404_NOT_FOUND) 


class ViewDocument(APIView):
    def get(self, request, id):
        try:
            document = Document.objects.get(id=id)
            response = FileResponse(document.file.open('rb'))
            response['Content-Disposition'] = f'inline; filename="{document.file.name}"'
            return response
        except Document.DoesNotExist:
            raise Http404("Document not found")               


class DeleteDocument(APIView):
    # permission_classes = [IsAuthenticated]  # optional if you later want to secure it

    def delete(self, request, id):
        try:
            document = Document.objects.get(id=id)
            document.delete()
            return Response({'message': 'Document deleted successfully.'}, status=status.HTTP_200_OK)
        except Document.DoesNotExist:
            return Response({'message': 'Document not found.'}, status=status.HTTP_404_NOT_FOUND)            