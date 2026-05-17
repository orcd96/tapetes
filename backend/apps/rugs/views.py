from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Rug, RugPhoto
from .serializers import RugSerializer, RugStatusSerializer, RugPhotoSerializer
from apps.orders.models import ServiceOrder


class OrderRugListCreateView(generics.ListCreateAPIView):
    serializer_class = RugSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Rug.objects.filter(
            service_order_id=self.kwargs['order_pk']
        ).prefetch_related('photos')

    def perform_create(self, serializer):
        order = ServiceOrder.objects.get(pk=self.kwargs['order_pk'])
        index = order.rugs.count() + 1
        rug = serializer.save(
            service_order=order,
            index=index,
            registered_by=self.request.user,
        )
        order.update_totals()
        return rug


class RugDetailView(generics.RetrieveUpdateAPIView):
    queryset = Rug.objects.prefetch_related('photos')
    serializer_class = RugSerializer
    permission_classes = [IsAuthenticated]

    def perform_update(self, serializer):
        rug = serializer.save()
        rug.service_order.update_totals()


class RugStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            rug = Rug.objects.get(pk=pk)
        except Rug.DoesNotExist:
            return Response({'error': 'No encontrado'}, status=status.HTTP_404_NOT_FOUND)
        serializer = RugStatusSerializer(rug, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            self._sync_order_status(rug.service_order)
            return Response(RugSerializer(rug, context={'request': request}).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def _sync_order_status(self, order):
        rugs = order.rugs.all()
        if not rugs.exists():
            return
        if all(r.status == 'ready' for r in rugs):
            order.status = 'ready'
            order.save(update_fields=['status'])
        elif any(r.status in ('washing', 'ready') for r in rugs):
            order.status = 'washing'
            order.save(update_fields=['status'])


class RugPhotoUploadView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated]

    def post(self, request, rug_pk):
        try:
            rug = Rug.objects.get(pk=rug_pk)
        except Rug.DoesNotExist:
            return Response({'error': 'No encontrado'}, status=status.HTTP_404_NOT_FOUND)
        serializer = RugPhotoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(rug=rug, uploaded_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class WasherRugListView(generics.ListAPIView):
    serializer_class = RugSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Rug.objects.filter(
            assigned_washer=self.request.user,
            status__in=['received', 'washing', 'ready'],
        ).prefetch_related('photos')
